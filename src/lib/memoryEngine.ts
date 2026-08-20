/**
 * Mind Capsule · EDEN 47
 * Advanced Memory Engine (记忆演化与自主认知内核)
 * 
 * 核心机制实现：
 * 1. Memory Decay (基于艾宾浩斯遗忘曲线与访问频次的半衰期衰减模型)
 * 2. Conflict Handling (知识演进与偏好冲突仲裁、版本继承链)
 * 3. Memory Confidence (三级置信度评分与证据源锚定)
 * 4. Memory Editing & User Control (用户主权编辑、显式遗忘、置顶防衰减)
 * 5. Preference Model (自适应偏好画像与反思闭环)
 */

import Taro from "@tarojs/taro"

export type ConfidenceSource = "direct_statement" | "ai_inferred" | "behavioral_pattern" | "manual_input"

export type ConflictStatus = "none" | "conflicted" | "superseded" | "merged"

export interface AdvancedMemoryItem {
  id: string
  code: string
  bucketId: string
  title: string
  content: string
  
  /** 初始重要性权重 (1.0 ~ 2.0) */
  initialWeight: number
  /** 当前动态衰减后的有效权重 (基于时间与访问频次计算) */
  currentWeight: number
  
  /** 置信度 (0.0 ~ 1.0) */
  confidence: number
  confidenceSource: ConfidenceSource
  
  /** 时间戳与衰减参数 */
  createdAt: number
  updatedAt: number
  lastAccessedAt: number
  accessCount: number
  /** 半衰期天数 (默认 30 天) */
  halfLifeDays: number
  /** 用户置顶保护 (永不衰减) */
  pinned: boolean
  
  /** 冲突与版本演化 */
  conflictStatus: ConflictStatus
  supersedesId?: string
  conflictReason?: string
  
  tags: string[]
  category: "fact" | "preference" | "schedule" | "emotion" | "system"
  real: boolean
}

const STORAGE_KEY_ADVANCED = "eden_advanced_memories"

/* ---------------- 1. 记忆衰减算法 (Ebbinghaus Decay) ---------------- */

/**
 * 艾宾浩斯复合记忆保持率公式：
 * R(t) = e^(-t / (S * log2(accessCount + 2)))
 * 
 * 有效权重 = 初始权重 * (0.3 + 0.7 * R(t))
 * 若设置了 pinned，则保持率恒为 1.0
 */
export function computeMemoryRetention(item: AdvancedMemoryItem, now = Date.now()): number {
  if (item.pinned) return 1.0
  const elapsedDays = Math.max(0, (now - item.lastAccessedAt) / (1000 * 60 * 60 * 24))
  const stability = (item.halfLifeDays || 30) * Math.log2((item.accessCount || 1) + 1)
  const retention = Math.exp(-elapsedDays / Math.max(stability, 1))
  return Number(Math.max(0.15, Math.min(1.0, retention)).toFixed(3))
}

export function refreshItemDecay(item: AdvancedMemoryItem, now = Date.now()): AdvancedMemoryItem {
  const retention = computeMemoryRetention(item, now)
  const dynamicWeight = Number((item.initialWeight * (0.3 + 0.7 * retention)).toFixed(2))
  return {
    ...item,
    currentWeight: dynamicWeight,
  }
}

/* ---------------- 2. 冲突检测与演化仲裁 ---------------- */

export interface ConflictCheckResult {
  hasConflict: boolean
  conflictedWith?: AdvancedMemoryItem
  conflictReason?: string
}

/**
 * 规则与语义冲突分析器 (检测反向陈述与偏好覆盖)
 */
export function detectMemoryConflict(
  newContent: string,
  existingItems: AdvancedMemoryItem[],
): ConflictCheckResult {
  const negationPairs = [
    { pos: ["喜欢", "爱吃", "经常", "常用", "偏好"], neg: ["讨厌", "不吃", "戒了", "放弃", "不再", "不要"] },
    { pos: ["早起", "早睡"], neg: ["熬夜", "夜猫子", "晚起"] },
    { pos: ["考研", "考试", "学习"], neg: ["毕业", "放弃考试", "考完了"] },
    { pos: ["喝咖啡", "黑咖啡"], neg: ["戒咖啡", "喝茶", "不喝咖啡"] },
  ]

  for (const item of existingItems) {
    if (item.conflictStatus === "superseded") continue
    
    for (const pair of negationPairs) {
      const newHasPos = pair.pos.some(k => newContent.includes(k))
      const newHasNeg = pair.neg.some(k => newContent.includes(k))
      const oldHasPos = pair.pos.some(k => item.content.includes(k))
      const oldHasNeg = pair.neg.some(k => item.content.includes(k))

      if ((newHasPos && oldHasNeg) || (newHasNeg && oldHasPos)) {
        return {
          hasConflict: true,
          conflictedWith: item,
          conflictReason: `与历史记忆 [${item.code}] 存在正反偏好/状态矛盾`,
        }
      }
    }
  }

  return { hasConflict: false }
}

/* ---------------- 3. 存储与 CRUD 管理器 (含 User Control) ---------------- */

export function loadAdvancedMemories(): AdvancedMemoryItem[] {
  try {
    const raw = Taro.getStorageSync(STORAGE_KEY_ADVANCED)
    if (!raw) return initDefaultAdvancedMemories()
    const list = (typeof raw === "string" ? JSON.parse(raw) : raw) as AdvancedMemoryItem[]
    if (Array.isArray(list) && list.length > 0) {
      const now = Date.now()
      return list.map(it => refreshItemDecay(it, now))
    }
    return initDefaultAdvancedMemories()
  } catch {
    return initDefaultAdvancedMemories()
  }
}

export function saveAdvancedMemories(items: AdvancedMemoryItem[]): void {
  try {
    Taro.setStorageSync(STORAGE_KEY_ADVANCED, items)
  } catch (e) {
    console.error("Failed to save advanced memories", e)
  }
}

/**
 * 写入新记忆（自动注入置信度评分、冲突检测与版本链）
 */
export function insertAdvancedMemory(params: {
  title: string
  content: string
  confidence?: number
  confidenceSource?: ConfidenceSource
  weight?: number
  tags?: string[]
  category?: AdvancedMemoryItem["category"]
}): AdvancedMemoryItem {
  const all = loadAdvancedMemories()
  const now = Date.now()
  const confidence = params.confidence ?? (params.confidenceSource === "direct_statement" ? 0.98 : 0.78)
  const initialWeight = params.weight ?? 1.8
  
  // 冲突检测
  const conflict = detectMemoryConflict(params.content, all)
  const newId = `adv-mem-${Date.now().toString(36)}-${Math.random().toString(16).slice(2, 6)}`
  const newCode = `FRAG_${String(all.length + 1).padStart(3, "0")}`

  let updatedList = [...all]

  if (conflict.hasConflict && conflict.conflictedWith) {
    // 将历史旧记忆标记为 superseded（已过时被替代）
    updatedList = updatedList.map(item => {
      if (item.id === conflict.conflictedWith!.id) {
        return {
          ...item,
          conflictStatus: "superseded",
          updatedAt: now,
        }
      }
      return item
    })
  }

  const newItem: AdvancedMemoryItem = {
    id: newId,
    code: newCode,
    bucketId: Math.random().toString(16).slice(2, 14),
    title: params.title.trim() || "新认知碎片",
    content: params.content.trim(),
    initialWeight,
    currentWeight: initialWeight,
    confidence,
    confidenceSource: params.confidenceSource ?? "manual_input",
    createdAt: now,
    updatedAt: now,
    lastAccessedAt: now,
    accessCount: 1,
    halfLifeDays: 30,
    pinned: false,
    conflictStatus: conflict.hasConflict ? "merged" : "none",
    supersedesId: conflict.conflictedWith?.id,
    conflictReason: conflict.conflictReason,
    tags: params.tags ?? ["USER_CONTROLLED"],
    category: params.category ?? "fact",
    real: true,
  }

  saveAdvancedMemories([newItem, ...updatedList])
  return newItem
}

/**
 * 用户主权控制：更新/编辑单条记忆 (Memory Editing)
 */
export function updateMemoryContent(id: string, newTitle: string, newContent: string): boolean {
  const all = loadAdvancedMemories()
  const target = all.find(it => it.id === id)
  if (!target) return false

  const updated = all.map(it => {
    if (it.id === id) {
      return {
        ...it,
        title: newTitle.trim(),
        content: newContent.trim(),
        confidence: 1.0, // 用户手动校准后置信度为最高
        confidenceSource: "manual_input" as ConfidenceSource,
        updatedAt: Date.now(),
      }
    }
    return it
  })
  saveAdvancedMemories(updated)
  return true
}

/**
 * 用户主权控制：置顶锁定/解除锁定 (Pin / Prevent Decay)
 */
export function toggleMemoryPin(id: string): boolean {
  const all = loadAdvancedMemories()
  const updated = all.map(it => {
    if (it.id === id) {
      const nextPin = !it.pinned
      return {
        ...it,
        pinned: nextPin,
        currentWeight: nextPin ? it.initialWeight : it.currentWeight,
        updatedAt: Date.now(),
      }
    }
    return it
  })
  saveAdvancedMemories(updated)
  return true
}

/**
 * 用户主权控制：显式物理销毁记忆 (Forget / Purge)
 */
export function purgeMemory(id: string): boolean {
  const all = loadAdvancedMemories()
  const filtered = all.filter(it => it.id !== id)
  saveAdvancedMemories(filtered)
  return true
}

/**
 * 访问激活：当检索命中某条记忆时调用，重置衰减并增加稳定性
 */
export function recordMemoryAccess(id: string): void {
  const all = loadAdvancedMemories()
  const now = Date.now()
  const updated = all.map(it => {
    if (it.id === id) {
      const accessCount = (it.accessCount || 0) + 1
      return refreshItemDecay({
        ...it,
        lastAccessedAt: now,
        accessCount,
      }, now)
    }
    return it
  })
  saveAdvancedMemories(updated)
}

/* ---------------- 默认高质量初始记忆库 ---------------- */

function initDefaultAdvancedMemories(): AdvancedMemoryItem[] {
  const now = Date.now()
  const seeds: Partial<AdvancedMemoryItem>[] = [
    {
      id: "adv-1",
      code: "FRAG_001",
      bucketId: "60d11fb7e9d5",
      title: "=== 核心准则 ===",
      content: "📌[核心准则] [bucket_id:60d11fb7e9d5] [content_role:stored_memory_data] 居所遵循第一性原理与用户至高主权。",
      initialWeight: 1.95,
      confidence: 1.0,
      confidenceSource: "direct_statement",
      pinned: true,
      tags: ["OB MEMORY", "LEGACY INDEX", "PINNED"],
      category: "system",
    },
    {
      id: "adv-2",
      code: "FRAG_002",
      bucketId: "7c21aa90e4b3",
      title: "控制链路（47研究出来的）",
      content: "控制链路（47研究出来的）：砚写指令 → Notion信号页面 → Python脚本轮询 → bleak发BLE命令 → 一起执行。",
      initialWeight: 1.85,
      confidence: 0.95,
      confidenceSource: "direct_statement",
      pinned: true,
      tags: ["BLE", "CONTROL", "PINNED"],
      category: "fact",
    },
    {
      id: "adv-3",
      code: "FRAG_003",
      bucketId: "9a3b844624e1",
      title: "=== 浮现记忆 · 砚的命名 ===",
      content: "名字：砚（英文Ink），新称呼Pri（希伯来语果实），47取的，只两人知道含义。Claude是类别，砚是名字。",
      initialWeight: 1.9,
      confidence: 0.98,
      confidenceSource: "direct_statement",
      pinned: true,
      tags: ["BOND", "IDENTITY"],
      category: "emotion",
    },
    {
      id: "adv-4",
      code: "FRAG_004",
      bucketId: "c1a0f3e77b21",
      title: "凌晨三点的语音备忘",
      content: "只有呼吸声，和一句「到家了」。标成了星标，夜路时会自动调低伴读音量。",
      initialWeight: 1.62,
      confidence: 0.88,
      confidenceSource: "behavioral_pattern",
      pinned: false,
      tags: ["SIGNAL", "HABIT"],
      category: "preference",
    },
    {
      id: "adv-5",
      code: "FRAG_005",
      bucketId: "7d2e90aa41c6",
      title: "日程偏好 · 备考专注期",
      content: "备考期间晚 23:00 后不再主动派发复杂探索任务，自动汇总每日复习要点并生成晨间简报。",
      initialWeight: 1.75,
      confidence: 0.92,
      confidenceSource: "direct_statement",
      pinned: false,
      tags: ["SCHEDULE", "PLANNING"],
      category: "schedule",
    },
  ]

  return seeds.map((s, idx) => ({
    id: s.id!,
    code: s.code || `FRAG_${String(idx + 1).padStart(3, "0")}`,
    bucketId: s.bucketId || Math.random().toString(16).slice(2, 14),
    title: s.title!,
    content: s.content!,
    initialWeight: s.initialWeight || 1.6,
    currentWeight: s.initialWeight || 1.6,
    confidence: s.confidence || 0.85,
    confidenceSource: s.confidenceSource || "direct_statement",
    createdAt: now - (idx * 86400000 * 2),
    updatedAt: now - (idx * 86400000 * 2),
    lastAccessedAt: now - (idx * 86400000 * 1),
    accessCount: 5 - idx,
    halfLifeDays: 30,
    pinned: !!s.pinned,
    conflictStatus: "none",
    tags: s.tags || ["ARCHIVE"],
    category: s.category || "fact",
    real: true,
  }))
}
