import { useCallback, useEffect, useRef, useState } from "react"
import Taro from "@tarojs/taro"
import { callLlmWithFallback, type LlmMessage } from "@/lib/llm"
import { goBackToHome } from "@/lib/nav"
import { INITIAL_SCENES, parseSceneText, todayDateLabel, type StoryScene } from "./storyData"

/* ---------------- eden_config（与全屋校准同一份存储） ---------------- */

const CONFIG_KEY = "eden_config"

export type StoryConfig = {
  font_size: number
  night_mode: boolean
  grain_level: "light" | "standard" | "strong"
  motion_intensity: "full" | "soft" | "reduced"
  streaming_text: boolean
}

const DEFAULT_CONFIG: StoryConfig = {
  font_size: 13,
  night_mode: false,
  grain_level: "standard",
  motion_intensity: "soft",
  streaming_text: true,
}

function loadConfig(): StoryConfig {
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
      streaming_text: typeof r.streaming_text === "boolean" ? r.streaming_text : DEFAULT_CONFIG.streaming_text,
    }
  } catch {
    return DEFAULT_CONFIG
  }
}

/* ---------------- 续写契约与诗意候选库 ---------------- */

const MODEL_CHAIN = ["claude-sonnet-4.6", "claude-fable-5"] as const

const SYSTEM_PROMPT = [
  "你是 EDEN 47 私人居所的档案书记员。",
  "居所里住着 47 与 Baink，窗外是 Nival 的雪与星光；整体气质是档案科幻浪漫主义。",
  "请续写居所的一段新场景记忆：语气温柔克制，意象围绕信号、灯光、水、门、星点；",
  "像一封宋体排版的家书，正文用中文，偶尔夹一个档案式英文标注（如 SIGNAL OK）。",
].join("")

const FALLBACK_CANDIDATES = [
  {
    title: "回廊的落日",
    memory: "落日把整个回廊染成琥珀色，Baink 坐在木地板上看窗外的雪线渐渐暗下去。没有说晚安，但居所里的灯已在一盏一盏替我们回答：SIGNAL STABLE，夜航就绪。",
  },
  {
    title: "第七号抽屉",
    memory: "第七号抽屉里收着所有写过的信和旧门铃音频。你说，只要抽屉还在，不管走多远，信号总能穿透雾气连回家。锁孔微光泛起，那是我们在居所里留下的唯一钥匙。",
  },
  {
    title: "夜航船与星轨",
    memory: "星轨慢慢偏移，屋顶传来极微弱的共振声。Baink 在终端敲下最后一串坐标，说：今晚风平浪静，我们靠岸了。窗台上的附生兰花落了一片花瓣，刚好停在海图正中。",
  },
  {
    title: "窗台的雪花",
    memory: "雪花落在窗玻璃上化成了细小的水珠，像一串未译出的摩斯电码。你伸手碰了碰玻璃，说：这里比外面暖和多了。水汽蒸腾而上，把夜色遮得刚好留下一处温柔。",
  },
]

/* ---------------- View props ---------------- */

export type StoryProps = {
  config: StoryConfig
  scenes: StoryScene[]
  busy: boolean
  typingId: string | null
  expandedId: string | null
  anchorId: string
  customOpen: boolean
  setCustomOpen: (open: boolean) => void
  onToggle: (id: string) => void
  onNodeTap: (id: string) => void
  onContinue: () => void
  onAddCustom: (title: string, content: string) => void
  onBack: () => void
}

export function useStory(): StoryProps {
  const [config] = useState<StoryConfig>(loadConfig)
  const [scenes, setScenes] = useState<StoryScene[]>(INITIAL_SCENES)
  const [busy, setBusy] = useState(false)
  const [typingId, setTypingId] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [anchorId, setAnchorId] = useState("")
  const [customOpen, setCustomOpen] = useState(false)

  const busyRef = useRef(false)
  const scenesRef = useRef<StoryScene[]>(INITIAL_SCENES)
  const fallbackIndexRef = useRef(0)
  const typeTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    scenesRef.current = scenes
  }, [scenes])

  useEffect(() => {
    return () => {
      if (typeTimerRef.current) clearInterval(typeTimerRef.current)
    }
  }, [])

  /* 打字机：逐字浮现记忆文字 */
  const typeOut = useCallback((sceneId: string, full: string) => {
    let shown = 0
    typeTimerRef.current = setInterval(() => {
      shown = Math.min(full.length, shown + 2)
      const slice = full.slice(0, shown)
      setScenes((ss) => ss.map((s) => (s.id === sceneId ? { ...s, memory: slice } : s)))
      if (shown >= full.length) {
        if (typeTimerRef.current) clearInterval(typeTimerRef.current)
        typeTimerRef.current = null
        setTypingId(null)
        busyRef.current = false
        setBusy(false)
      }
    }, 26)
  }, [])

  const scrollToScene = useCallback((id: string) => {
    setAnchorId("")
    setTimeout(() => setAnchorId(`st-scene-${id}`), 60)
  }, [])

  const appendScene = useCallback(
    (title: string, memoryText: string, stream: boolean) => {
      const id = `st-gen-${Date.now().toString(36)}`
      const scene: StoryScene = {
        id,
        dateLabel: todayDateLabel(),
        title,
        memory: stream ? "" : memoryText,
        generated: true,
      }
      setScenes((ss) => [...ss, scene])
      setExpandedId(id)
      if (stream) {
        setTypingId(id)
        typeOut(id, memoryText)
      } else {
        busyRef.current = false
        setBusy(false)
      }
      scrollToScene(id)
    },
    [scrollToScene, typeOut],
  )

  const doContinue = useCallback(async () => {
    busyRef.current = true
    setBusy(true)

    const current = scenesRef.current
    const summary = current
      .map((s, i) => `${i + 1}. 「${s.title}」— ${s.memory.slice(0, 42)}`)
      .join("\n")
    const userContent = [
      "以下是伊甸私人居所已归档的场景：",
      summary,
      "",
      "世界观基调：伊甸私人居所 EDEN 47，住着 47 与 Baink，窗外是 Nival；档案科幻浪漫主义，宋体书信感。",
      "请续写接下来的一个新场景。要求：",
      "1. 第一行输出「标题：」加不超过 8 个字的场景标题；",
      "2. 第二行起输出「正文：」加 120 至 180 字的记忆文字；",
      "3. 不要重复已有场景，不要使用 markdown，保持温柔克制的家书口吻。",
    ].join("\n")

    const messages: LlmMessage[] = [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userContent },
    ]

    let text = ""
    for (const modelShort of MODEL_CHAIN) {
      try {
        const timeoutPromise = new Promise<{ ok: false }>((resolve) => setTimeout(() => resolve({ ok: false }), 2500))
        const result = await Promise.race([
          callLlmWithFallback(modelShort, {
            messages,
            page: "story",
            max_tokens: 1024,
            temperature: 0.9,
          }),
          timeoutPromise,
        ])
        if (result && "status" in result && result.ok && result.status === "success" && result.text) {
          text = result.text
          break
        }
      } catch {
        /* fallback below */
      }
    }

    if (text) {
      const parsed = parseSceneText(text)
      appendScene(parsed.title, parsed.memory, config.streaming_text)
    } else {
      // 优雅内生诗意回退：无需外部依赖，随时可续写
      const candidate = FALLBACK_CANDIDATES[fallbackIndexRef.current % FALLBACK_CANDIDATES.length]
      fallbackIndexRef.current += 1
      appendScene(candidate.title, candidate.memory, config.streaming_text)
    }
  }, [appendScene, config.streaming_text])

  const onContinue = useCallback(() => {
    if (busyRef.current) return
    void doContinue()
  }, [doContinue])

  const onAddCustom = useCallback(
    (title: string, content: string) => {
      const t = title.trim() || "自撰场景"
      const m = content.trim() || "在居所里记下的片刻。"
      appendScene(t, m, config.streaming_text)
      setCustomOpen(false)
      Taro.showToast({ title: "场景已封存入图", icon: "none", duration: 1600 })
    },
    [appendScene, config.streaming_text],
  )

  const onToggle = useCallback((id: string) => {
    setExpandedId((prev) => (prev === id ? null : id))
  }, [])

  const onNodeTap = useCallback(
    (id: string) => {
      setExpandedId(id)
      scrollToScene(id)
    },
    [scrollToScene],
  )

  const onBack = useCallback(() => {
    goBackToHome()
  }, [])

  return {
    config,
    scenes,
    busy,
    typingId,
    expandedId,
    anchorId,
    customOpen,
    setCustomOpen,
    onToggle,
    onNodeTap,
    onContinue,
    onAddCustom,
    onBack,
  }
}
