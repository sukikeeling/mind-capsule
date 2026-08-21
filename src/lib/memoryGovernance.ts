/**
 * Mind Capsule · Personal AI Runtime
 * Memory Audit Log & User Governance Layer
 * 
 * 核心机制：
 * 1. 记忆审计日志 (Audit Log)：记录每一次 AI 提议、用户校准、冲突仲裁与撤销
 * 2. 隔离暂存区 (Provisional Quarantine)：AI 自主推断的记忆必须经用户审核/显式许可
 * 3. 治理操作流：Approve (通过), Reject (拒绝), Revoke (撤销), Rollback (时光回滚)
 * 4. 彻底解决“AI 胡乱记忆/篡改认知”的失控隐患，确立用户绝对主权
 */

import Taro from "@tarojs/taro"
import { loadTemporalGraph, saveTemporalGraph, type MemoryNode } from "./temporalMemoryGraph"

export type GovernanceAction =
  | "ai_propose"    // AI 主动推断提议
  | "user_approve"   // 用户审核通过
  | "user_reject"    // 用户拒绝
  | "user_edit"      // 用户手动校准
  | "user_revoke"    // 用户彻底撤销
  | "time_rollback"  // 历史快照回滚

export interface MemoryAuditEntry {
  id: string
  timestamp: number
  action: GovernanceAction
  targetNodeId: string
  operator: "ai_agent" | "user"
  triggerReason: string
  diffSummary: string
  previousSnapshot?: Partial<MemoryNode>
  newSnapshot?: Partial<MemoryNode>
}

const AUDIT_LOG_STORAGE_KEY = "eden_memory_audit_logs"

/* ---------------- 1. 审计日志持久化 ---------------- */

export function loadAuditLogs(): MemoryAuditEntry[] {
  try {
    const raw = Taro.getStorageSync(AUDIT_LOG_STORAGE_KEY)
    if (!raw) return []
    const logs = (typeof raw === "string" ? JSON.parse(raw) : raw) as MemoryAuditEntry[]
    return Array.isArray(logs) ? logs : []
  } catch {
    return []
  }
}

export function recordAuditLog(entry: Omit<MemoryAuditEntry, "id" | "timestamp">): MemoryAuditEntry {
  const logs = loadAuditLogs()
  const newEntry: MemoryAuditEntry = {
    ...entry,
    id: `audit-${Date.now().toString(36)}-${Math.random().toString(16).slice(2, 6)}`,
    timestamp: Date.now(),
  }
  try {
    Taro.setStorageSync(AUDIT_LOG_STORAGE_KEY, [newEntry, ...logs].slice(0, 500))
  } catch (e) {
    console.error("Failed to save audit log", e)
  }
  return newEntry
}

/* ---------------- 2. 暂存区治理工作流 ---------------- */

/**
 * AI 提议新记忆（写入暂存区 Provisional，等待用户治理审批）
 */
export function proposeAiMemory(params: {
  statement: string
  entity: string
  category: MemoryNode["category"]
  confidence: number
  triggerReason: string
}): MemoryNode {
  const graph = loadTemporalGraph()
  const now = Date.now()
  const id = `node-prov-${now.toString(36)}-${Math.random().toString(16).slice(2, 6)}`
  const code = `PROV_${String(Object.keys(graph.nodes).length + 1).padStart(3, "0")}`

  const provisionalNode: MemoryNode = {
    id,
    code,
    statement: params.statement.trim(),
    entity: params.entity.trim(),
    category: params.category,
    confidence: params.confidence,
    initialWeight: 1.6,
    currentWeight: 1.6,
    validFrom: now,
    lastAccessedAt: now,
    accessCount: 1,
    version: 1,
    rootId: id,
    governanceState: "provisional", // 隔离暂存态
    pinned: false,
    tags: ["AI_PROPOSED", "PENDING_REVIEW"],
  }

  graph.nodes[id] = provisionalNode
  saveTemporalGraph(graph)

  // 写入审计日志
  recordAuditLog({
    action: "ai_propose",
    targetNodeId: id,
    operator: "ai_agent",
    triggerReason: params.triggerReason,
    diffSummary: `AI 从交互中推断提议新记忆 [${params.entity}]: ${params.statement.slice(0, 30)}...`,
    newSnapshot: provisionalNode,
  })

  return provisionalNode
}

/**
 * 用户审核通过：转为正式 Active 记忆
 */
export function approveProvisionalMemory(nodeId: string): boolean {
  const graph = loadTemporalGraph()
  const target = graph.nodes[nodeId]
  if (!target || target.governanceState !== "provisional") return false

  const prev = { ...target }
  target.governanceState = "active"
  target.tags = target.tags.filter(t => t !== "PENDING_REVIEW").concat("USER_APPROVED")
  saveTemporalGraph(graph)

  recordAuditLog({
    action: "user_approve",
    targetNodeId: nodeId,
    operator: "user",
    triggerReason: "用户在治理控制台中显式批准该记忆进入主图谱",
    diffSummary: `批准记忆 [${target.code}] 激活生效`,
    previousSnapshot: prev,
    newSnapshot: target,
  })

  return true
}

/**
 * 用户拒绝并物理销毁暂存记忆
 */
export function rejectProvisionalMemory(nodeId: string): boolean {
  const graph = loadTemporalGraph()
  const target = graph.nodes[nodeId]
  if (!target) return false

  const prev = { ...target }
  delete graph.nodes[nodeId]
  graph.edges = graph.edges.filter(e => e.sourceId !== nodeId && e.targetId !== nodeId)
  saveTemporalGraph(graph)

  recordAuditLog({
    action: "user_reject",
    targetNodeId: nodeId,
    operator: "user",
    triggerReason: "用户拒绝此条 AI 记忆提议",
    diffSummary: `拒绝并物理销毁提议记忆 [${target.code}]`,
    previousSnapshot: prev,
  })

  return true
}

/**
 * 用户时光回滚：依据审计日志恢复历史快照
 */
export function rollbackMemoryToSnapshot(auditLogId: string): boolean {
  const logs = loadAuditLogs()
  const entry = logs.find(l => l.id === auditLogId)
  if (!entry || !entry.previousSnapshot || !entry.targetNodeId) return false

  const graph = loadTemporalGraph()
  graph.nodes[entry.targetNodeId] = {
    ...(graph.nodes[entry.targetNodeId] || {}),
    ...(entry.previousSnapshot as MemoryNode),
  }
  saveTemporalGraph(graph)

  recordAuditLog({
    action: "time_rollback",
    targetNodeId: entry.targetNodeId,
    operator: "user",
    triggerReason: `基于审计记录 [${auditLogId}] 执行时光快照回滚`,
    diffSummary: `回滚节点 [${entry.targetNodeId}] 到操作前状态`,
    newSnapshot: graph.nodes[entry.targetNodeId],
  })

  return true
}
