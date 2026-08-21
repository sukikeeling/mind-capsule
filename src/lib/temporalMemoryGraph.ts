/**
 * Mind Capsule · Personal AI Runtime
 * Temporal Memory Graph (时间演化记忆图谱)
 * 
 * 核心架构：
 * 1. 实体与事实节点 (MemoryNode)：包含演化版本树、置信度、衰减权重
 * 2. 关系有向边 (MemoryEdge)：derives_from(派生), supersedes(替代), conflicts_with(冲突), corroborates(佐证), associates_with(关联)
 * 3. 演化时序链与拓扑子图提取 (Temporal Traversal)
 * 4. 彻底告别扁平列表，支持立体认知演进与历史溯源
 */

import Taro from "@tarojs/taro"

export type EdgeRelation =
  | "derives_from"     // 衍生自上游事实
  | "supersedes"       // 替代旧版本（演进）
  | "conflicts_with"   // 存在正反矛盾
  | "corroborates"     // 多源佐证强化
  | "associates_with"  // 语义关联

export interface MemoryNode {
  id: string
  code: string
  statement: string
  entity: string
  category: "fact" | "preference" | "schedule" | "emotion" | "identity"
  
  /** 认知置信度 (0.0 ~ 1.0) */
  confidence: number
  /** 基础权重与当前衰减权重 */
  initialWeight: number
  currentWeight: number
  
  /** 时序属性 */
  validFrom: number
  validUntil?: number
  lastAccessedAt: number
  accessCount: number
  
  /** 版本控制与溯源 */
  version: number
  rootId: string
  previousVersionId?: string
  
  /** 治理状态 */
  governanceState: "active" | "provisional" | "superseded" | "revoked"
  pinned: boolean
  tags: string[]
}

export interface MemoryEdge {
  id: string
  sourceId: string
  targetId: string
  relation: EdgeRelation
  weight: number
  createdAt: number
  description?: string
}

export interface TemporalMemoryGraph {
  nodes: Record<string, MemoryNode>
  edges: MemoryEdge[]
  version: number
  updatedAt: number
}

const GRAPH_STORAGE_KEY = "eden_temporal_memory_graph"

/* ---------------- 1. 图谱存储与初始化 ---------------- */

export function loadTemporalGraph(): TemporalMemoryGraph {
  try {
    const raw = Taro.getStorageSync(GRAPH_STORAGE_KEY)
    if (!raw) return initSeedTemporalGraph()
    const g = (typeof raw === "string" ? JSON.parse(raw) : raw) as TemporalMemoryGraph
    if (g && g.nodes && Array.isArray(g.edges)) return g
    return initSeedTemporalGraph()
  } catch {
    return initSeedTemporalGraph()
  }
}

export function saveTemporalGraph(graph: TemporalMemoryGraph): void {
  try {
    graph.updatedAt = Date.now()
    graph.version += 1
    Taro.setStorageSync(GRAPH_STORAGE_KEY, graph)
  } catch (e) {
    console.error("Failed to save temporal graph", e)
  }
}

/* ---------------- 2. 节点与边的演化操作 ---------------- */

/**
 * 插入新节点并建立时序关系边
 */
export function insertGraphNode(params: {
  statement: string
  entity: string
  category: MemoryNode["category"]
  confidence?: number
  weight?: number
  governanceState?: MemoryNode["governanceState"]
  tags?: string[]
  relateTo?: { targetId: string; relation: EdgeRelation; description?: string }[]
}): MemoryNode {
  const graph = loadTemporalGraph()
  const now = Date.now()
  const id = `node-${now.toString(36)}-${Math.random().toString(16).slice(2, 6)}`
  const nodeCount = Object.keys(graph.nodes).length
  const code = `NODE_${String(nodeCount + 1).padStart(3, "0")}`

  const newNode: MemoryNode = {
    id,
    code,
    statement: params.statement.trim(),
    entity: params.entity.trim(),
    category: params.category,
    confidence: params.confidence ?? 0.85,
    initialWeight: params.weight ?? 1.8,
    currentWeight: params.weight ?? 1.8,
    validFrom: now,
    lastAccessedAt: now,
    accessCount: 1,
    version: 1,
    rootId: id,
    governanceState: params.governanceState ?? "active",
    pinned: false,
    tags: params.tags ?? ["TEMPORAL_GRAPH"],
  }

  graph.nodes[id] = newNode

  // 建立关联边
  if (params.relateTo && params.relateTo.length > 0) {
    for (const rel of params.relateTo) {
      if (graph.nodes[rel.targetId]) {
        const edge: MemoryEdge = {
          id: `edge-${now.toString(36)}-${Math.random().toString(16).slice(2, 6)}`,
          sourceId: id,
          targetId: rel.targetId,
          relation: rel.relation,
          weight: 1.0,
          createdAt: now,
          description: rel.description,
        }
        graph.edges.push(edge)

        // 若是替代关系，将旧节点标记为 superseded
        if (rel.relation === "supersedes") {
          graph.nodes[rel.targetId].governanceState = "superseded"
          graph.nodes[rel.targetId].validUntil = now
          newNode.version = graph.nodes[rel.targetId].version + 1
          newNode.rootId = graph.nodes[rel.targetId].rootId || rel.targetId
          newNode.previousVersionId = rel.targetId
        }
      }
    }
  }

  saveTemporalGraph(graph)
  return newNode
}

/**
 * 拓扑子图提取 (根据实体或关键词召回上下文关联网络)
 */
export function extractSubgraph(entityOrQuery: string, maxDepth = 2): { nodes: MemoryNode[]; edges: MemoryEdge[] } {
  const graph = loadTemporalGraph()
  const q = entityOrQuery.toLowerCase()
  
  // 查找种子匹配节点
  const seedIds = Object.values(graph.nodes)
    .filter(n => n.governanceState !== "revoked" && (n.entity.toLowerCase().includes(q) || n.statement.toLowerCase().includes(q)))
    .map(n => n.id)

  if (seedIds.length === 0) return { nodes: [], edges: [] }

  const visitedNodeIds = new Set<string>(seedIds)
  const matchedEdges: MemoryEdge[] = []

  let currentFrontier = [...seedIds]

  for (let depth = 0; depth < maxDepth; depth++) {
    const nextFrontier: string[] = []
    for (const edge of graph.edges) {
      if (currentFrontier.includes(edge.sourceId) && !visitedNodeIds.has(edge.targetId)) {
        visitedNodeIds.add(edge.targetId)
        nextFrontier.push(edge.targetId)
        matchedEdges.push(edge)
      } else if (currentFrontier.includes(edge.targetId) && !visitedNodeIds.has(edge.sourceId)) {
        visitedNodeIds.add(edge.sourceId)
        nextFrontier.push(edge.sourceId)
        matchedEdges.push(edge)
      } else if (visitedNodeIds.has(edge.sourceId) && visitedNodeIds.has(edge.targetId)) {
        if (!matchedEdges.find(e => e.id === edge.id)) {
          matchedEdges.push(edge)
        }
      }
    }
    currentFrontier = nextFrontier
    if (currentFrontier.length === 0) break
  }

  const resultNodes = Array.from(visitedNodeIds)
    .map(id => graph.nodes[id])
    .filter(Boolean)

  return {
    nodes: resultNodes,
    edges: matchedEdges,
  }
}

/* ---------------- 3. 初始时序记忆种子图 ---------------- */

function initSeedTemporalGraph(): TemporalMemoryGraph {
  const now = Date.now()
  const n1: MemoryNode = {
    id: "node-identity-1",
    code: "NODE_001",
    statement: "数字居所核心协议：遵循第一性原理与用户至高数字主权。",
    entity: "EDEN_CORE",
    category: "identity",
    confidence: 1.0,
    initialWeight: 2.0,
    currentWeight: 2.0,
    validFrom: now - 86400000 * 10,
    lastAccessedAt: now,
    accessCount: 12,
    version: 1,
    rootId: "node-identity-1",
    governanceState: "active",
    pinned: true,
    tags: ["CORE", "SOVEREIGNTY"],
  }

  const n2: MemoryNode = {
    id: "node-baink-1",
    code: "NODE_002",
    statement: "伴侣命名为砚（Pri），希伯来语含义为果实，只两人知晓其深意。",
    entity: "Baink",
    category: "emotion",
    confidence: 0.98,
    initialWeight: 1.9,
    currentWeight: 1.9,
    validFrom: now - 86400000 * 5,
    lastAccessedAt: now,
    accessCount: 8,
    version: 1,
    rootId: "node-baink-1",
    governanceState: "active",
    pinned: true,
    tags: ["BOND", "NAME"],
  }

  const n3: MemoryNode = {
    id: "node-schedule-1",
    code: "NODE_003",
    statement: "备考期夜间 23:00 后开启静音与暖光护眼，自动汇总每日复习进度。",
    entity: "StudySchedule",
    category: "schedule",
    confidence: 0.92,
    initialWeight: 1.75,
    currentWeight: 1.75,
    validFrom: now - 86400000 * 2,
    lastAccessedAt: now,
    accessCount: 4,
    version: 1,
    rootId: "node-schedule-1",
    governanceState: "active",
    pinned: false,
    tags: ["EXAM", "FOCUS"],
  }

  const edge1: MemoryEdge = {
    id: "edge-1-2",
    sourceId: n2.id,
    targetId: n1.id,
    relation: "derives_from",
    weight: 1.0,
    createdAt: now,
    description: "人格命名衍生自核心协议",
  }

  return {
    nodes: {
      [n1.id]: n1,
      [n2.id]: n2,
      [n3.id]: n3,
    },
    edges: [edge1],
    version: 1,
    updatedAt: now,
  }
}
