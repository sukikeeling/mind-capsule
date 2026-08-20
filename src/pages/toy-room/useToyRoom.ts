import { useCallback, useEffect, useRef, useState } from "react"
import Taro from "@tarojs/taro"
import { goBackToHome } from "@/lib/nav"

/* ---------------- eden_config（与全屋校准同一份存储） ---------------- */

const CONFIG_KEY = "eden_config"

export type ToyRoomConfig = {
  night_mode: boolean
  grain_level: "light" | "standard" | "strong"
  motion_intensity: "full" | "soft" | "reduced"
}

const DEFAULT_CONFIG: ToyRoomConfig = {
  night_mode: false,
  grain_level: "standard",
  motion_intensity: "soft",
}

function loadConfig(): ToyRoomConfig {
  try {
    const raw = Taro.getStorageSync(CONFIG_KEY)
    if (!raw) return DEFAULT_CONFIG
    const r = (typeof raw === "string" ? JSON.parse(raw) : raw) as Record<string, unknown>
    return {
      night_mode: typeof r.night_mode === "boolean" ? r.night_mode : DEFAULT_CONFIG.night_mode,
      grain_level:
        r.grain_level === "light" || r.grain_level === "strong" ? r.grain_level : DEFAULT_CONFIG.grain_level,
      motion_intensity:
        r.motion_intensity === "full" || r.motion_intensity === "reduced"
          ? r.motion_intensity
          : DEFAULT_CONFIG.motion_intensity,
    }
  } catch {
    return DEFAULT_CONFIG
  }
}

/* ---------------- 物理铜铃 Web Audio 声效合成 ---------------- */

function playBellChime() {
  if (typeof window === "undefined") return
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
    if (!AudioCtx) return
    const ctx = new AudioCtx()
    const now = ctx.currentTime

    // 铜铃泛音阵列：基频与谐波
    const frequencies = [880, 1760, 2640, 3520]
    const gains = [0.35, 0.22, 0.1, 0.04]

    frequencies.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = "sine"
      osc.frequency.setValueAtTime(freq, now)

      // 瞬态起振 + 指数自然衰减
      gain.gain.setValueAtTime(0, now)
      gain.gain.linearRampToValueAtTime(gains[i], now + 0.005)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + (1.3 - i * 0.22))

      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(now)
      osc.stop(now + 1.4)
    })
  } catch {
    // 降级保护
  }
}

/* ---------------- 互动常量 ---------------- */

const PURR_TEXT = "呼噜噜…"
const MEOW_TEXT = "喵。"
/** 两次点猫间隔小于该值视为连点 */
const CONSECUTIVE_WINDOW_MS = 1500
/** 连点达到该次数后猫开始兴奋（耳朵抖 + 气泡变「喵。」） */
const EXCITED_STREAK = 3
/** 气泡存活时长（与 CSS tr-bubble 动画时长一致） */
const BUBBLE_LIFE_MS = 2000
/** 同屏气泡上限 */
const MAX_BUBBLES = 2
/** 铃铛状态行闪烁时长 */
const TINKLE_FLASH_MS = 1400

/* ---------------- View props ---------------- */

export type PurrBubble = {
  id: number
  text: string
}

export type ToyRoomProps = {
  config: ToyRoomConfig
  purrCount: number
  bubbles: PurrBubble[]
  wagTick: number
  earTick: number
  bellTick: number
  tinkleFlash: boolean
  onTapCat: () => void
  onTapBell: () => void
  onBack: () => void
}

export function useToyRoom(): ToyRoomProps {
  const [config] = useState<ToyRoomConfig>(loadConfig)
  const [purrCount, setPurrCount] = useState(0)
  const [bubbles, setBubbles] = useState<PurrBubble[]>([])
  const [wagTick, setWagTick] = useState(0)
  const [earTick, setEarTick] = useState(0)
  const [bellTick, setBellTick] = useState(0)
  const [tinkleFlash, setTinkleFlash] = useState(false)

  const bubbleIdRef = useRef(0)
  const lastTapRef = useRef(0)
  const streakRef = useRef(0)
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([])
  const flashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const timers = timersRef.current
    return () => {
      timers.forEach((t) => clearTimeout(t))
      if (flashTimerRef.current) clearTimeout(flashTimerRef.current)
    }
  }, [])

  /* 点猫：摇尾 + 呼噜气泡 + 计数；连点 ≥3 次耳朵抖、气泡换「喵。」 */
  const onTapCat = useCallback(() => {
    const now = Date.now()
    streakRef.current = now - lastTapRef.current <= CONSECUTIVE_WINDOW_MS ? streakRef.current + 1 : 1
    lastTapRef.current = now
    const excited = streakRef.current >= EXCITED_STREAK

    setWagTick((t) => t + 1)
    if (excited) setEarTick((t) => t + 1)
    setPurrCount((n) => n + 1)

    const id = ++bubbleIdRef.current
    setBubbles((prev) => {
      const next = [...prev, { id, text: excited ? MEOW_TEXT : PURR_TEXT }]
      return next.length > MAX_BUBBLES ? next.slice(next.length - MAX_BUBBLES) : next
    })
    timersRef.current.push(
      setTimeout(() => {
        setBubbles((prev) => prev.filter((b) => b.id !== id))
      }, BUBBLE_LIFE_MS),
    )
  }, [])

  /* 点铃铛：播放清脆物理铜铃音效 + 摇晃 + 状态行闪 TINKLE RECORDED */
  const onTapBell = useCallback(() => {
    playBellChime()
    setBellTick((t) => t + 1)
    setTinkleFlash(true)
    if (flashTimerRef.current) clearTimeout(flashTimerRef.current)
    flashTimerRef.current = setTimeout(() => setTinkleFlash(false), TINKLE_FLASH_MS)
  }, [])

  const onBack = useCallback(() => {
    goBackToHome()
  }, [])

  return {
    config,
    purrCount,
    bubbles,
    wagTick,
    earTick,
    bellTick,
    tinkleFlash,
    onTapCat,
    onTapBell,
    onBack,
  }
}
