/**
 * Mind Capsule · EDEN 47
 * Autonomous Assistant & Multi-Layer Agent Architecture
 * 
 * 落地 8 层 Personal AI 系统：
 * 1. Identity Layer (角色边界、语气风格、道德底线)
 * 2. Memory Layer (接入 memoryEngine 衰减/冲突/置信度)
 * 3. Planning Layer (前瞻性主动任务规划，如备考规划、健康预警)
 * 4. Tool Layer (调度工具链与外部协议)
 * 5. Security Layer (权限确认与隐私隔离)
 * 6. Evaluation Layer (执行反馈与偏好校准闭环)
 * 7. Sync Layer (多端状态同步)
 * 8. Recovery Layer (快照与人格容灾)
 */

import Taro from "@tarojs/taro"

export interface AutonomousPlanStep {
  id: string
  title: string
  detail: string
  toolName?: string
  status: "pending" | "executing" | "completed" | "skipped"
  requiresPermission: boolean
  output?: string
}

export interface AutonomousGoal {
  id: string
  triggerSource: "proactive_inference" | "user_request" | "scheduled_event"
  detectedNeed: string
  hypothesis: string
  steps: AutonomousPlanStep[]
  createdAt: number
  status: "drafted" | "approved" | "in_progress" | "done"
  feedbackScore?: number // 1 ~ 5
  feedbackNote?: string
}

const GOALS_STORAGE_KEY = "eden_autonomous_goals"

/* ---------------- 1. 主动意图识别与规划器 ---------------- */

/**
 * 意图嗅探器：从用户日常行为/输入中识别潜在的前瞻性需求
 * 范例：
 * 不是：“帮我总结会议”
 * 而是：“发现你下周有考试，自动整理资料，提醒计划，生成复习路线。”
 */
export function inferProactiveGoal(userRecentContext: string): AutonomousGoal | null {
  const text = userRecentContext.toLowerCase()
  
  if (text.includes("考试") || text.includes("复习") || text.includes("考研") || text.includes("期末")) {
    return {
      id: `goal-exam-${Date.now().toString(36)}`,
      triggerSource: "proactive_inference",
      detectedNeed: "检测到近期有重要考试/备考安排",
      hypothesis: "用户处于高负荷备考期，需要自动化梳理知识盲区、生成每日复习进度并规划冲刺时间表。",
      status: "drafted",
      createdAt: Date.now(),
      steps: [
        {
          id: "step-1",
          title: "资料检索与核心考点归纳",
          detail: "从共同记忆库与已上传文档中提取重点公式、高频考点大纲",
          toolName: "archive_retriever",
          status: "pending",
          requiresPermission: false,
        },
        {
          id: "step-2",
          title: "生成 7 天冲刺复习路线图",
          detail: "按轻重缓急拆解每日 2 小时专注模块，生成结构化 Markdown",
          toolName: "schedule_generator",
          status: "pending",
          requiresPermission: false,
        },
        {
          id: "step-3",
          title: "居所模式自适应切换",
          detail: "夜间 23:00 自动开启静音护眼与勿扰模式，清晨 07:30 播报复习要点",
          toolName: "device_calibrator",
          status: "pending",
          requiresPermission: true, // 涉及设备与提醒，需权限确认
        },
      ],
    }
  }

  if (text.includes("累") || text.includes("失眠") || text.includes("睡不着") || text.includes("压力大")) {
    return {
      id: `goal-comfort-${Date.now().toString(36)}`,
      triggerSource: "proactive_inference",
      detectedNeed: "检测到情绪疲惫或睡眠困难信号",
      hypothesis: "用户需要温和的情感陪伴与睡眠声景自适应调节。",
      status: "drafted",
      createdAt: Date.now(),
      steps: [
        {
          id: "step-1",
          title: "黑胶电台切换至夜间白噪音/氦气歌单",
          detail: "自动载入《Helium》与《Through the Night》舒缓波形",
          toolName: "radio_controller",
          status: "pending",
          requiresPermission: false,
        },
        {
          id: "step-2",
          title: "全屋色温降至 2200K 暖黄光",
          detail: "调整居所视觉参数，降低界面微噪点与动效强度",
          toolName: "calibration_bridge",
          status: "pending",
          requiresPermission: true,
        },
      ],
    }
  }

  return null
}

/* ---------------- 2. 反馈闭环 (Evaluation Layer & Preference Update) ---------------- */

export function submitGoalFeedback(
  goalId: string,
  score: number, // 1 (差评) ~ 5 (好评)
  note?: string,
): void {
  const goals = loadGoals()
  const updated = goals.map(g => {
    if (g.id === goalId) {
      return {
        ...g,
        feedbackScore: score,
        feedbackNote: note,
        status: "done" as const,
      }
    }
    return g
  })
  saveGoals(updated)
}

export function loadGoals(): AutonomousGoal[] {
  try {
    const raw = Taro.getStorageSync(GOALS_STORAGE_KEY)
    if (!raw) return []
    return (typeof raw === "string" ? JSON.parse(raw) : raw) as AutonomousGoal[]
  } catch {
    return []
  }
}

export function saveGoals(goals: AutonomousGoal[]): void {
  try {
    Taro.setStorageSync(GOALS_STORAGE_KEY, goals)
  } catch (e) {
    console.error("Failed to save goals", e)
  }
}
