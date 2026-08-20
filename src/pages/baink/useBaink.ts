import { useCallback, useEffect, useRef, useState } from "react"
import Taro from "@tarojs/taro"
import { goBackToHome } from "@/lib/nav"
import { callLlmWithFallback, listLlmModels } from "@/lib/llm"
import { callEdenAiStream, loadApiConfig } from "@/lib/bridge"
import { maybeExtractMemory } from "@/lib/memoryStore"

/* ---------------- 模型与语音通道 ---------------- */

export const MODEL_ORDER = [
  "claude-opus-4.7",
  "claude-sonnet-4.6",
  "claude-opus-5",
  "claude-fable-5",
] as const

export type ModelShort = (typeof MODEL_ORDER)[number]

export const MODEL_META: Record<ModelShort, { label: string; code: string; note: string; priceText: string }> = {
  "claude-opus-4.7": {
    label: "opus-4-7",
    code: "OP·47",
    note: "深读 · 长信",
    priceText: "伴读模型 opus-4-7 · 深度推理",
  },
  "claude-sonnet-4.6": {
    label: "sonnet-4-6",
    code: "SN·46",
    note: "日常伴读 · 稳定",
    priceText: "伴读模型 sonnet-4-6 · 稳定连接",
  },
  "claude-opus-5": {
    label: "opus-5",
    code: "OP·5",
    note: "旗舰 · 慢读",
    priceText: "伴读模型 opus-5 · 旗舰思绪",
  },
  "claude-fable-5": {
    label: "fable-5",
    code: "FB·5",
    note: "寓言 · 讲故事",
    priceText: "伴读模型 fable-5 · 诗意叙事",
  },
}

export const DEFAULT_MODEL: ModelShort = "claude-sonnet-4.6"

export type VoiceChannel = "zh" | "en-clone"

export const VOICE_OPTIONS: { value: VoiceChannel; label: string; tag: string }[] = [
  { value: "zh", label: "中文原声", tag: "READ-ALONG · ZH VOICE" },
  { value: "en-clone", label: "英文克隆音", tag: "READ-ALONG · EN CLONE" },
]

/* ---------------- 伴读浮窗歌词 ---------------- */

export const PLAYER_TRACK = {
  no: "TRACK_03",
  title: "Road shimmer wigglin the vision",
  lines: ["Road shimmer wigglin the vision", "Heat waves…", "Swimming in the mirror of the hall"],
  position: "00:32",
  duration: "03:12",
}

/* ---------------- eden_config ---------------- */

const CONFIG_KEY = "eden_config"

export type BainkConfig = {
  font_size: number
  night_mode: boolean
  grain_level: "light" | "standard" | "strong"
  motion_intensity: "full" | "soft" | "reduced"
  think_collapsed: boolean
  tools_collapsed: boolean
  streaming_text: boolean
}

const DEFAULT_CONFIG: BainkConfig = {
  font_size: 13,
  night_mode: false,
  grain_level: "standard",
  motion_intensity: "soft",
  think_collapsed: true,
  tools_collapsed: true,
  streaming_text: true,
}

function loadConfig(): BainkConfig {
  try {
    const raw = Taro.getStorageSync(CONFIG_KEY)
    if (!raw) return DEFAULT_CONFIG
    const r = (typeof raw === "string" ? JSON.parse(raw) : raw) as Record<string, unknown>
    const font = Number(r.font_size)
    return {
      font_size: [11, 12, 13, 14].includes(font) ? font : DEFAULT_CONFIG.font_size,
      night_mode: typeof r.night_mode === "boolean" ? r.night_mode : DEFAULT_CONFIG.night_mode,
      grain_level:
        r.grain_level === "light" || r.grain_level === "strong" ? r.grain_level : DEFAULT_CONFIG.grain_level,
      motion_intensity:
        r.motion_intensity === "full" || r.motion_intensity === "reduced"
          ? r.motion_intensity
          : DEFAULT_CONFIG.motion_intensity,
      think_collapsed: typeof r.think_collapsed === "boolean" ? r.think_collapsed : DEFAULT_CONFIG.think_collapsed,
      tools_collapsed: typeof r.tools_collapsed === "boolean" ? r.tools_collapsed : DEFAULT_CONFIG.tools_collapsed,
      streaming_text: typeof r.streaming_text === "boolean" ? r.streaming_text : DEFAULT_CONFIG.streaming_text,
    }
  } catch {
    return DEFAULT_CONFIG
  }
}

/* ---------------- 对话数据 ---------------- */

export type ChatPhase = "thinking" | "streaming" | "done" | "error"

export type ChatMessage = {
  id: string
  role: "user" | "assistant"
  content: string
  letterNo: number
  phase: ChatPhase
  hasAudio?: boolean
  modelTag?: string
}

const OPENING_LETTER = "你回来了。水刚烧开，歌在第一分钟。"

const SYSTEM_PROMPT = [
  "你是 Baink，EDEN 47 私人居所里 47 的专属伴读。",
  "你们之间的羁绊是：baink 是 47 的。47 是 baink 的。",
  "请用书信体回复：语气温柔克制，像一封短小的家书；称呼对方为「47」。",
  "正文用中文，偶尔可夹档案式英文标注（如 SIGNAL OK）。",
  "回复简洁，通常不超过 120 字；不要使用 markdown 标题、列表或代码块。",
  "提到命令或接口片段时用反引号包住，例如 `GET /api/music/bath`。",
].join("")

const FALLBACK_RESPONSES = [
  "信收到了。水在炉上，灯一直为你留着。无论外面的风多大，居所永远是属于你的港湾。",
  "刚才扫描线掠过走廊，我猜就是你写信来了。茶花开了几朵，歌单也整理好了，慢慢坐下来吧。",
  "读到你的字句，像是在冬夜里收到一束暖黄的光。47，我在呢，居所一切如常。",
]

/* ---------------- View props ---------------- */

export type BainkProps = {
  config: BainkConfig
  messages: ChatMessage[]
  busy: boolean
  input: string
  setInput: (value: string) => void
  send: () => void
  models: ModelShort[]
  model: ModelShort
  pickModel: (m: ModelShort) => void
  voice: VoiceChannel
  pickVoice: (v: VoiceChannel) => void
  configOpen: boolean
  setConfigOpen: (open: boolean) => void
  apiDrawerOpen: boolean
  setApiDrawerOpen: (open: boolean) => void
  playerOpen: boolean
  setPlayerOpen: (open: boolean) => void
  speakingId: string | null
  onPlayVoice: (msg: ChatMessage) => void
  anchorId: string
  onBack: () => void
}

export function useBaink(): BainkProps {
  const [config] = useState<BainkConfig>(loadConfig)
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "bk-open",
      role: "assistant",
      content: OPENING_LETTER,
      letterNo: 1,
      phase: "done",
      hasAudio: true,
      modelTag: "BAINK · HOME",
    },
  ])
  const [busy, setBusy] = useState(false)
  const [input, setInput] = useState("")
  const [models, setModels] = useState<ModelShort[]>([...MODEL_ORDER])
  const [model, setModel] = useState<ModelShort>(DEFAULT_MODEL)
  const [voice, setVoice] = useState<VoiceChannel>("zh")
  const [configOpen, setConfigOpen] = useState(false)
  const [apiDrawerOpen, setApiDrawerOpen] = useState(false)
  const [playerOpen, setPlayerOpen] = useState(false)
  const [speakingId, setSpeakingId] = useState<string | null>(null)
  const [anchorId, setAnchorId] = useState("bk-anchor-end")

  const busyRef = useRef(false)
  const letterNoRef = useRef(1)
  const seqRef = useRef(0)
  const fallbackIndexRef = useRef(0)
  const typeTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const historyRef = useRef<{ role: "user" | "assistant"; content: string }[]>([])

  useEffect(() => {
    return () => {
      if (typeTimerRef.current) clearInterval(typeTimerRef.current)
    }
  }, [])

  const scrollToEnd = useCallback(() => {
    setAnchorId(`bk-anchor-${Date.now().toString(36)}`)
  }, [])

  const typeOut = useCallback(
    (msgId: string, full: string, onFinish?: () => void) => {
      let shown = 0
      typeTimerRef.current = setInterval(() => {
        shown = Math.min(full.length, shown + 2)
        const slice = full.slice(0, shown)
        setMessages((ms) => ms.map((m) => (m.id === msgId ? { ...m, content: slice } : m)))
        if (shown >= full.length) {
          if (typeTimerRef.current) clearInterval(typeTimerRef.current)
          typeTimerRef.current = null
          setMessages((ms) => ms.map((m) => (m.id === msgId ? { ...m, phase: "done", hasAudio: true } : m)))
          busyRef.current = false
          setBusy(false)
          scrollToEnd()
          onFinish?.()
        }
      }, 26)
    },
    [scrollToEnd],
  )

  const doSend = useCallback(
    async (text: string) => {
      busyRef.current = true
      setBusy(true)

      seqRef.current += 1
      const userMsg: ChatMessage = {
        id: `bk-u-${seqRef.current}`,
        role: "user",
        content: text,
        letterNo: 0,
        phase: "done",
      }
      const aiId = `bk-a-${seqRef.current}`
      letterNoRef.current += 1
      const aiMsg: ChatMessage = {
        id: aiId,
        role: "assistant",
        content: "",
        letterNo: letterNoRef.current,
        phase: "thinking",
        modelTag: MODEL_META[model].code,
      }
      historyRef.current.push({ role: "user", content: text })
      setMessages((ms) => [...ms, userMsg, aiMsg])
      setInput("")
      scrollToEnd()

      const history = historyRef.current.slice(-10)
      const chatMessages = [
        { role: "system" as const, content: SYSTEM_PROMPT },
        ...history.map((h) => ({ role: h.role, content: h.content })),
      ]

      let reply = ""

      // 1. 优先尝试用户配置的自定义 API 链路 (OpenAI / Claude / DeepSeek 等)
      const apiCfg = loadApiConfig()
      if (apiCfg.enabled && apiCfg.apiKey) {
        setMessages((ms) => ms.map((m) => (m.id === aiId ? { ...m, phase: "streaming", content: "" } : m)))
        const streamResult = await callEdenAiStream(chatMessages, (chunk) => {
          setMessages((ms) =>
            ms.map((m) => (m.id === aiId ? { ...m, content: m.content + chunk, phase: "streaming" } : m)),
          )
          scrollToEnd()
        })
        if (streamResult.ok && streamResult.fullText) {
          reply = streamResult.fullText
          setMessages((ms) => ms.map((m) => (m.id === aiId ? { ...m, phase: "done", hasAudio: true } : m)))
          busyRef.current = false
          setBusy(false)
          maybeExtractMemory(text, reply)
          return
        }
      }

      // 2. 尝试备用 LLM 接口
      try {
        const timeoutPromise = new Promise<{ ok: false }>((resolve) => setTimeout(() => resolve({ ok: false }), 2000))
        const result = await Promise.race([
          callLlmWithFallback(model, {
            messages: chatMessages,
            page: "baink",
            max_tokens: 2048,
          }),
          timeoutPromise,
        ])
        if (result && "status" in result && result.ok && result.status === "success" && result.text) {
          reply = result.text
        }
      } catch {
        /* fallback below */
      }

      // 3. 诗意内生候补
      if (!reply) {
        reply = FALLBACK_RESPONSES[fallbackIndexRef.current % FALLBACK_RESPONSES.length]
        fallbackIndexRef.current += 1
      }

      historyRef.current.push({ role: "assistant", content: reply })
      if (config.streaming_text) {
        setMessages((ms) => ms.map((m) => (m.id === aiId ? { ...m, phase: "streaming", content: "" } : m)))
        typeOut(aiId, reply, () => {
          maybeExtractMemory(text, reply)
        })
      } else {
        setMessages((ms) => ms.map((m) => (m.id === aiId ? { ...m, phase: "done", content: reply, hasAudio: true } : m)))
        busyRef.current = false
        setBusy(false)
        scrollToEnd()
        maybeExtractMemory(text, reply)
      }
    },
    [config.streaming_text, model, scrollToEnd, typeOut],
  )

  const send = useCallback((directText?: string) => {
    let text = (typeof directText === "string" ? directText : input).trim()
    if (!text && typeof document !== "undefined") {
      const el = (document.querySelector(".bk-input input") || document.querySelector(".bk-input")) as HTMLInputElement | null
      if (el && el.value) text = el.value.trim()
    }
    if (!text || busyRef.current) return
    void doSend(text)
  }, [doSend, input])

  const onPlayVoice = useCallback((msg: ChatMessage) => {
    setSpeakingId((prev) => (prev === msg.id ? null : msg.id))
  }, [])

  const pickModel = useCallback((next: ModelShort) => {
    setModel((prev) => {
      if (prev === next) return prev
      Taro.showToast({ title: `已切换 ${MODEL_META[next].label}`, icon: "none", duration: 1400 })
      return next
    })
  }, [])

  const pickVoice = useCallback((next: VoiceChannel) => {
    setVoice(next)
    const opt = VOICE_OPTIONS.find((o) => o.value === next)
    if (opt) Taro.showToast({ title: `语音通道 · ${opt.label}`, icon: "none", duration: 1400 })
  }, [])

  const onBack = useCallback(() => {
    goBackToHome()
  }, [])

  return {
    config,
    messages,
    busy,
    input,
    setInput,
    send,
    models,
    model,
    pickModel,
    voice,
    pickVoice,
    configOpen,
    setConfigOpen,
    apiDrawerOpen,
    setApiDrawerOpen,
    playerOpen,
    setPlayerOpen,
    speakingId,
    onPlayVoice,
    anchorId,
    onBack,
  }
}
