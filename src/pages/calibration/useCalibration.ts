import { useCallback, useEffect, useRef, useState } from "react"
import Taro from "@tarojs/taro"
import { pbRequest } from "@/lib/pb"
import { goBackToHome } from "@/lib/nav"
import { getMiniAuthState } from "@/lib/miniAuth"

export type DensityMode = "compact" | "standard" | "relaxed"
export type MotionMode = "full" | "soft" | "reduced"
export type GrainMode = "light" | "standard" | "strong"

export type EdenConfig = {
  font_size: number
  density: DensityMode
  motion_intensity: MotionMode
  grain_level: GrainMode
  night_mode: boolean
  think_collapsed: boolean
  tools_collapsed: boolean
  streaming_text: boolean
}

export type SyncState = "searching" | "ready"

export const STORAGE_KEY = "eden_config"
const DEVICE_KEY = "eden_device_id"
const SAVE_DEBOUNCE_MS = 800
const SAVE_FLASH_MS = 1600

export const DEFAULT_CONFIG: EdenConfig = {
  font_size: 13,
  density: "standard",
  motion_intensity: "soft",
  grain_level: "standard",
  night_mode: false,
  think_collapsed: true,
  tools_collapsed: true,
  streaming_text: true,
}

export const FONT_OPTIONS = [11, 12, 13, 14] as const

export type SegmentOption<T extends string | number> = { value: T; label: string }

export const DENSITY_OPTIONS: SegmentOption<DensityMode>[] = [
  { value: "compact", label: "紧凑" },
  { value: "standard", label: "标准" },
  { value: "relaxed", label: "舒展" },
]

export const MOTION_OPTIONS: SegmentOption<MotionMode>[] = [
  { value: "full", label: "完整" },
  { value: "soft", label: "柔和" },
  { value: "reduced", label: "减少" },
]

export const GRAIN_OPTIONS: SegmentOption<GrainMode>[] = [
  { value: "light", label: "淡" },
  { value: "standard", label: "标准" },
  { value: "strong", label: "明显" },
]

export const PREVIEW_TEXT = "回到家以后，字应该刚好够近，也留得下呼吸。"

type UserConfigRecord = Partial<EdenConfig> & { id?: string; user_id?: string }

function isDensity(v: unknown): v is DensityMode {
  return v === "compact" || v === "standard" || v === "relaxed"
}
function isMotion(v: unknown): v is MotionMode {
  return v === "full" || v === "soft" || v === "reduced"
}
function isGrain(v: unknown): v is GrainMode {
  return v === "light" || v === "standard" || v === "strong"
}

function sanitizeConfig(raw: unknown, fallback: EdenConfig): EdenConfig {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>
  const font = Number(r.font_size)
  return {
    font_size: FONT_OPTIONS.includes(font as (typeof FONT_OPTIONS)[number]) ? font : fallback.font_size,
    density: isDensity(r.density) ? r.density : fallback.density,
    motion_intensity: isMotion(r.motion_intensity) ? r.motion_intensity : fallback.motion_intensity,
    grain_level: isGrain(r.grain_level) ? r.grain_level : fallback.grain_level,
    night_mode: typeof r.night_mode === "boolean" ? r.night_mode : fallback.night_mode,
    think_collapsed: typeof r.think_collapsed === "boolean" ? r.think_collapsed : fallback.think_collapsed,
    tools_collapsed: typeof r.tools_collapsed === "boolean" ? r.tools_collapsed : fallback.tools_collapsed,
    streaming_text: typeof r.streaming_text === "boolean" ? r.streaming_text : fallback.streaming_text,
  }
}

function loadLocalConfig(): EdenConfig {
  try {
    const raw = Taro.getStorageSync(STORAGE_KEY)
    if (!raw) return DEFAULT_CONFIG
    if (typeof raw === "string") {
      if (!raw.trim()) return DEFAULT_CONFIG
      return sanitizeConfig(JSON.parse(raw), DEFAULT_CONFIG)
    }
    return sanitizeConfig(raw, DEFAULT_CONFIG)
  } catch {
    return DEFAULT_CONFIG
  }
}

function resolveIdentity(): string {
  try {
    const auth = getMiniAuthState()
    if (auth.loggedIn && auth.userId) return `rh-${String(auth.userId)}`
  } catch {
    /* 登录态读取失败不阻塞 */
  }
  try {
    const saved = Taro.getStorageSync(DEVICE_KEY)
    if (saved && typeof saved === "string") return saved
  } catch {
    /* ignore */
  }
  const fresh = `dev-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e8).toString(36)}`
  try {
    Taro.setStorageSync(DEVICE_KEY, fresh)
  } catch {
    /* ignore */
  }
  return fresh
}

export type CalibrationProps = {
  config: EdenConfig
  syncState: SyncState
  savedFlash: boolean
  onPatch: (patch: Partial<EdenConfig>) => void
  onBack: () => void
}

export function useCalibration(): CalibrationProps {
  const [config, setConfig] = useState<EdenConfig>(loadLocalConfig)
  const [syncState, setSyncState] = useState<SyncState>("searching")
  const [savedFlash, setSavedFlash] = useState(false)

  const configRef = useRef(config)
  const identityRef = useRef("")
  const recordIdRef = useRef<string | null>(null)
  const dirtyRef = useRef(false)
  const suppressSaveRef = useRef(false)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const flashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const flashSaved = useCallback(() => {
    setSavedFlash(true)
    if (flashTimerRef.current) clearTimeout(flashTimerRef.current)
    flashTimerRef.current = setTimeout(() => setSavedFlash(false), SAVE_FLASH_MS)
  }, [])

  const saveRemote = useCallback(async () => {
    const body = configRef.current
    const identity = identityRef.current
    try {
      if (recordIdRef.current) {
        await pbRequest(`/api/user_configs/${recordIdRef.current}`, { method: "PATCH", data: body })
      } else {
        const rec = await pbRequest<UserConfigRecord>("/api/user_configs", {
          method: "POST",
          data: { ...body, user_id: identity },
        })
        if (rec && rec.id) recordIdRef.current = String(rec.id)
      }
      flashSaved()
    } catch {
      /* 后端失败不阻塞 UI，本地存储已兜底 */
    }
  }, [flashSaved])

  const scheduleSave = useCallback(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => {
      saveTimerRef.current = null
      void saveRemote()
    }, SAVE_DEBOUNCE_MS)
  }, [saveRemote])

  // 任何调节：立即写本地存储（供其它页面读取），800ms 防抖写后端
  useEffect(() => {
    configRef.current = config
    if (suppressSaveRef.current) {
      suppressSaveRef.current = false
      return
    }
    if (!dirtyRef.current) return
    try {
      Taro.setStorageSync(STORAGE_KEY, config)
    } catch {
      /* ignore */
    }
    scheduleSave()
  }, [config, scheduleSave])

  // 进入页面：定位当前用户配置记录，无记录保持默认值
  useEffect(() => {
    let alive = true
    identityRef.current = resolveIdentity()
    pbRequest<{ items?: UserConfigRecord[] }>("/api/user_configs")
      .then((res) => {
        if (!alive) return
        setSyncState("ready")
        if (dirtyRef.current) return
        const items = res?.items ?? []
        const mine = items.find((it) => it && String(it.user_id ?? "") === identityRef.current)
        if (mine) {
          recordIdRef.current = mine.id ? String(mine.id) : null
          suppressSaveRef.current = true
          setConfig((prev) => sanitizeConfig({ ...prev, ...mine }, prev))
        }
      })
      .catch(() => {
        if (alive) setSyncState("ready")
      })
    return () => {
      alive = false
    }
  }, [])

  // 离场时若仍有未落库的调节，立即补发一次
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current)
        saveTimerRef.current = null
        void saveRemote()
      }
      if (flashTimerRef.current) clearTimeout(flashTimerRef.current)
    }
  }, [saveRemote])

  const onPatch = useCallback((patch: Partial<EdenConfig>) => {
    dirtyRef.current = true
    setConfig((prev) => sanitizeConfig({ ...prev, ...patch }, prev))
  }, [])

  const onBack = useCallback(() => {
    goBackToHome()
  }, [])

  return { config, syncState, savedFlash, onPatch, onBack }
}
