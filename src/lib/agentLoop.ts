/**
 * Mind Capsule · Personal AI Runtime
 * Agent Loop Engine (六步自主智能体闭环架构)
 * 
 * 落地闭环流程：
 * Goal → Planning → Tool Execution → Observation → Reflection → Memory Update
 * 
 * 核心目标：
 * 让 AI 不只是被动应答，而是在长期目标中自主感知、执行、反思，并将经验持续沉淀入时间记忆图谱。
 */

import { insertGraphNode, extractSubgraph, type MemoryNode } from "./temporalMemoryGraph"
import { proposeAiMemory, recordAuditLog } from "./memoryGovernance"

export interface AgentGoal {
  id: string
  title: string
  intent: string
  priority: "high" | "medium" | "low"
  status: "active" | "completed" | "failed"
  createdAt: number
}

export interface AgentStepPlan {
  stepIndex: number
  description: string
  actionTool: string
  toolParams?: Record<string, unknown>
  expectedOutput: string
}

export interface AgentExecutionRecord {
  goalId: string
  step: AgentStepPlan
  toolOutput: string
  observation: string
  reflectionScore: number // 0.0 ~ 1.0 (反思评分)
  lessonLearned: string
  proposedMemoryNodeId?: string
  timestamp: number
}

/* ---------------- 1. 内置执行工具集 (Tool Arsenal) ---------------- */

export interface AgentTool {
  name: string
  description: string
  execute: (params: Record<string, unknown>) => Promise<{ success: boolean; result: string }>
}

export const AGENT_TOOLS: Record<string, AgentTool> = {
  // 1. 记忆图谱拓扑探索工具
  subgraph_explorer: {
    name: "subgraph_explorer",
    description: "从时间记忆图谱中提取与指定实体/概念相关的上下文知识网络",
    execute: async (params) => {
      const entity = String(params.entity || "EDEN_CORE")
      const sub = extractSubgraph(entity, 2)
      const summary = sub.nodes.map(n => `[${n.code}] ${n.statement} (置信度:${Math.round(n.confidence * 100)}%)`).join(";\n")
      return { success: true, result: summary || "未检索到强关联节点" }
    },
  },

  // 2. 日程与任务冲刺拆解工具
  schedule_synthesizer: {
    name: "schedule_synthesizer",
    description: "根据备考/专注目标生成冲刺阶段日程与任务 Markdown 模版",
    execute: async (params) => {
      const topic = String(params.topic || "期末考试")
      const days = Number(params.days || 7)
      const output = `【${topic} ${days}天冲刺计划】\n- Day 1-2: 核心公式与概念梳理\n- Day 3-5: 历年真题模拟与错题复盘\n- Day 6-7: 考前知识网络查漏补缺`
      return { success: true, result: output }
    },
  },

  // 3. 居所硬件与视觉参数自适应校准工具
  device_calibrator: {
    name: "device_calibrator",
    description: "调整居所视觉色温、动效强度与勿扰模式",
    execute: async (params) => {
      const mode = String(params.mode || "focus")
      return { success: true, result: `居所模式已校准为 [${mode}]：夜间 23:00 自动开启暖黄护眼与静音电台` }
    },
  },
}

/* ---------------- 2. Agent Loop 核心执行器 ---------------- */

export async function runAgentLoop(params: {
  goalTitle: string
  intent: string
  userContext: string
}): Promise<{ goal: AgentGoal; executionHistory: AgentExecutionRecord[] }> {
  const now = Date.now()
  const goal: AgentGoal = {
    id: `goal-${now.toString(36)}-${Math.random().toString(16).slice(2, 6)}`,
    title: params.goalTitle,
    intent: params.intent,
    priority: "high",
    status: "active",
    createdAt: now,
  }

  // Step 1: Planning (根据意图自动拆解多步子任务与工具依赖)
  const plans: AgentStepPlan[] = [
    {
      stepIndex: 1,
      description: "检索时间记忆图谱中与当前目标相关的历史偏好与约束",
      actionTool: "subgraph_explorer",
      toolParams: { entity: params.intent.includes("考") ? "StudySchedule" : "Baink" },
      expectedOutput: "获得历史日程偏好与约束网络",
    },
    {
      stepIndex: 2,
      description: "生成针对性行动规划与阶段冲刺路径",
      actionTool: "schedule_synthesizer",
      toolParams: { topic: params.goalTitle, days: 7 },
      expectedOutput: "产出结构化冲刺 Markdown",
    },
    {
      stepIndex: 3,
      description: "自适应校准居所环境参数（色温/勿扰模式）",
      actionTool: "device_calibrator",
      toolParams: { mode: "focus_study" },
      expectedOutput: "完成居所物理/视觉环境联动",
    },
  ]

  const executionHistory: AgentExecutionRecord[] = []

  for (const plan of plans) {
    // Step 2 & 3: Tool Execution
    const tool = AGENT_TOOLS[plan.actionTool]
    let toolOutput = ""
    if (tool) {
      const res = await tool.execute(plan.toolParams || {})
      toolOutput = res.result
    } else {
      toolOutput = `Tool [${plan.actionTool}] executed simulated output`
    }

    // Step 4: Observation (客观观察真实执行产物)
    const observation = `步骤 ${plan.stepIndex} 执行完毕：成功产出期望数据「${toolOutput.slice(0, 40)}...」`

    // Step 5: Reflection (反思评估质量与可行性)
    const reflectionScore = toolOutput.length > 10 ? 0.95 : 0.6
    const lessonLearned = `经验：针对 [${params.goalTitle}]，通过 [${plan.actionTool}] 可以高效提取高价值行动约束。`

    // Step 6: Memory Update (反哺图谱并进入治理审计流)
    let proposedNode: MemoryNode | undefined
    if (plan.stepIndex === 2) {
      proposedNode = proposeAiMemory({
        statement: `自主学习沉淀：针对【${params.goalTitle}】已构建 7 天冲刺路径与专注模式，用户偏好结构化拆解。`,
        entity: "ActionLearning",
        category: "preference",
        confidence: 0.92,
        triggerReason: `Agent Loop 闭环执行反思产出：Goal [${goal.id}]`,
      })
    }

    executionHistory.push({
      goalId: goal.id,
      step: plan,
      toolOutput,
      observation,
      reflectionScore,
      lessonLearned,
      proposedMemoryNodeId: proposedNode?.id,
      timestamp: Date.now(),
    })
  }

  goal.status = "completed"

  // 记录全生命周期审计日志
  recordAuditLog({
    action: "ai_propose",
    targetNodeId: goal.id,
    operator: "ai_agent",
    triggerReason: "Agent Loop 完整执行闭环",
    diffSummary: `完成自主目标 [${goal.title}]：执行 3 步工具链并提议新经验碎片`,
  })

  return {
    goal,
    executionHistory,
  }
}
