/**
 * Mind Capsule · EDEN 47
 * Local Vector RAG & Semantic Retrieval Engine
 * 
 * 核心技术实现：
 * 1. 本地轻量 TF-IDF + N-Gram 字符特征向量化
 * 2. 余弦相似度 (Cosine Similarity) 稠密/稀疏向量匹配
 * 3. 艾宾浩斯时间保持率与语义相关度的复合重排 (Hybrid Re-Ranking)
 * 4. 自动 Prompt 上下文动态注水构建
 */

import { loadAdvancedMemories, computeMemoryRetention, type AdvancedMemoryItem } from "./memoryEngine"

export interface RAGRetrievalResult {
  fragment: AdvancedMemoryItem
  similarity: number
  retention: number
  finalScore: number
}

/* ---------------- 1. 轻量中文/英文分词与 N-Gram 提取 ---------------- */

function tokenize(text: string): string[] {
  if (!text) return []
  const clean = text.toLowerCase().replace(/[^\u4e00-\u9fa5a-z0-9]/g, " ")
  const tokens: string[] = []

  // 1. 英文单词按空格切分
  const words = clean.split(/\s+/).filter(w => w.length > 0)
  for (const w of words) {
    if (w.length >= 2) tokens.push(w)
  }

  // 2. 中文提取 2-gram 与 3-gram 特征词
  const cnText = text.replace(/[^\u4e00-\u9fa5]/g, "")
  for (let i = 0; i < cnText.length - 1; i++) {
    tokens.push(cnText.slice(i, i + 2))
    if (i < cnText.length - 2) {
      tokens.push(cnText.slice(i, i + 3))
    }
  }

  return tokens
}

/* ---------------- 2. TF-IDF 特征向量与余弦相似度 ---------------- */

interface VectorDoc {
  id: string
  item: AdvancedMemoryItem
  termFreqs: Map<string, number>
  norm: number
}

function buildVector(text: string, idfMap: Map<string, number>): { vector: Map<string, number>; norm: number } {
  const tokens = tokenize(text)
  const tf = new Map<string, number>()
  for (const t of tokens) {
    tf.set(t, (tf.get(t) || 0) + 1)
  }

  let sumSq = 0
  const vector = new Map<string, number>()
  for (const [term, freq] of tf.entries()) {
    const idf = idfMap.get(term) || 1.0
    const weight = (1 + Math.log(freq)) * idf
    vector.set(term, weight)
    sumSq += weight * weight
  }

  return {
    vector,
    norm: Math.sqrt(sumSq) || 1.0,
  }
}

function cosineSimilarity(
  v1: Map<string, number>,
  norm1: number,
  v2: Map<string, number>,
  norm2: number,
): number {
  let dotProduct = 0
  for (const [term, w1] of v1.entries()) {
    const w2 = v2.get(term)
    if (w2) {
      dotProduct += w1 * w2
    }
  }
  return dotProduct / (norm1 * norm2)
}

/* ---------------- 3. 真实 RAG 检索与复合重排 ---------------- */

export function queryMemoriesWithRAG(
  query: string,
  topK = 5,
  minSimilarity = 0.05,
): RAGRetrievalResult[] {
  const items = loadAdvancedMemories().filter(it => it.conflictStatus !== "superseded")
  if (items.length === 0 || !query.trim()) return []

  // 1. 计算全局 IDF (逆文档频率)
  const docCount = items.length
  const docFreqs = new Map<string, number>()

  const docTokens = items.map(item => {
    const tokens = Array.from(new Set(tokenize(`${item.title} ${item.content} ${item.tags.join(" ")}`)))
    for (const t of tokens) {
      docFreqs.set(t, (docFreqs.get(t) || 0) + 1)
    }
    return tokens
  })

  const idfMap = new Map<string, number>()
  for (const [term, df] of docFreqs.entries()) {
    idfMap.set(term, Math.log((docCount + 1) / (df + 1)) + 1)
  }

  // 2. 向量化文档库
  const queryVector = buildVector(query, idfMap)

  const results: RAGRetrievalResult[] = []

  for (let i = 0; i < items.length; i++) {
    const item = items[i]
    const docText = `${item.title} ${item.content} ${item.tags.join(" ")}`
    const docVec = buildVector(docText, idfMap)

    const sim = cosineSimilarity(queryVector.vector, queryVector.norm, docVec.vector, docVec.norm)
    const retention = computeMemoryRetention(item)

    // 复合评分：语义余弦相关度(60%) + 艾宾浩斯当前保持率与基础权重(40%)
    const finalScore = Number((sim * 0.6 + (retention * (item.currentWeight / 2.0)) * 0.4).toFixed(3))

    if (sim >= minSimilarity || retention > 0.85) {
      results.push({
        fragment: item,
        similarity: Number(sim.toFixed(3)),
        retention,
        finalScore,
      })
    }
  }

  // 按最终得分降序
  results.sort((a, b) => b.finalScore - a.finalScore)
  return results.slice(0, topK)
}

/* ---------------- 4. 自动化 System Prompt 记忆上下文注入 ---------------- */

export function buildRAGContextPrompt(userQuery: string): string {
  const retrieved = queryMemoriesWithRAG(userQuery, 4)
  if (retrieved.length === 0) return ""

  const memoryBlocks = retrieved
    .map(
      r =>
        `[碎片: ${r.fragment.code}] ${r.fragment.title} (权重:${r.fragment.currentWeight.toFixed(2)}, 置信度:${Math.round(r.fragment.confidence * 100)}%)\n内容: ${r.fragment.content}`,
    )
    .join("\n---\n")

  return `\n【居所黑曜石档案库检索召回的真实上下文】\n${memoryBlocks}\n请在回答中自然融合上述共同记忆与约定，维持彼此长久以来的默契与情感共振。\n`
}
