/**
 * Mind Capsule · EDEN 47
 * Global Context, State Management & Error Boundary
 */

import React, { createContext, useContext, useState, useEffect, type PropsWithChildren } from "react"
import Taro from "@tarojs/taro"
import { getCustomApiConfig, type CustomApiConfig } from "@/lib/llm"

export interface EdenGlobalState {
  nightMode: boolean
  fontSize: number
  density: "compact" | "standard" | "spacious"
  motionIntensity: "full" | "soft" | "reduced"
  grainLevel: "light" | "standard" | "strong"
  apiConfig: CustomApiConfig
  setNightMode: (on: boolean) => void
  setFontSize: (size: number) => void
  setDensity: (d: "compact" | "standard" | "spacious") => void
  setMotionIntensity: (m: "full" | "soft" | "reduced") => void
  setGrainLevel: (g: "light" | "standard" | "strong") => void
  updateApiConfig: (cfg: Partial<CustomApiConfig>) => void
}

const EdenContext = createContext<EdenGlobalState | null>(null)

export function useEdenState(): EdenGlobalState {
  const ctx = useContext(EdenContext)
  if (!ctx) {
    throw new Error("useEdenState must be used within EdenProvider")
  }
  return ctx
}

const CONFIG_KEY = "eden_config"

export function EdenProvider({ children }: PropsWithChildren) {
  const [nightMode, setNightMode] = useState(false)
  const [fontSize, setFontSize] = useState(13)
  const [density, setDensity] = useState<"compact" | "standard" | "spacious">("standard")
  const [motionIntensity, setMotionIntensity] = useState<"full" | "soft" | "reduced">("soft")
  const [grainLevel, setGrainLevel] = useState<"light" | "standard" | "strong">("standard")
  const [apiConfig, setApiConfig] = useState<CustomApiConfig>(getCustomApiConfig)

  // 恢复本地设置
  useEffect(() => {
    try {
      const raw = Taro.getStorageSync(CONFIG_KEY)
      if (raw) {
        const c = typeof raw === "string" ? JSON.parse(raw) : raw
        if (typeof c.night_mode === "boolean") setNightMode(c.night_mode)
        if (typeof c.font_size === "number") setFontSize(c.font_size)
        if (c.density) setDensity(c.density)
        if (c.motion_intensity) setMotionIntensity(c.motion_intensity)
        if (c.grain_level) setGrainLevel(c.grain_level)
      }
    } catch {
      // ignore
    }
  }, [])

  // 保存本地设置
  const persistConfig = (partial: Record<string, unknown>) => {
    try {
      const raw = Taro.getStorageSync(CONFIG_KEY)
      const prev = raw ? (typeof raw === "string" ? JSON.parse(raw) : raw) : {}
      Taro.setStorageSync(CONFIG_KEY, { ...prev, ...partial })
    } catch {
      // ignore
    }
  }

  const handleSetNightMode = (on: boolean) => {
    setNightMode(on)
    persistConfig({ night_mode: on })
  }

  const handleSetFontSize = (s: number) => {
    setFontSize(s)
    persistConfig({ font_size: s })
  }

  const handleSetDensity = (d: "compact" | "standard" | "spacious") => {
    setDensity(d)
    persistConfig({ density: d })
  }

  const handleSetMotionIntensity = (m: "full" | "soft" | "reduced") => {
    setMotionIntensity(m)
    persistConfig({ motion_intensity: m })
  }

  const handleSetGrainLevel = (g: "light" | "standard" | "strong") => {
    setGrainLevel(g)
    persistConfig({ grain_level: g })
  }

  const handleUpdateApiConfig = (cfg: Partial<CustomApiConfig>) => {
    const next = { ...apiConfig, ...cfg }
    setApiConfig(next)
    try {
      Taro.setStorageSync("eden_custom_api_config", next)
    } catch {
      // ignore
    }
  }

  const value: EdenGlobalState = {
    nightMode,
    fontSize,
    density,
    motionIntensity,
    grainLevel,
    apiConfig,
    setNightMode: handleSetNightMode,
    setFontSize: handleSetFontSize,
    setDensity: handleSetDensity,
    setMotionIntensity: handleSetMotionIntensity,
    setGrainLevel: handleSetGrainLevel,
    updateApiConfig: handleUpdateApiConfig,
  }

  return <EdenContext.Provider value={value}>{children}</EdenContext.Provider>
}

/* ---------------- 全局错误边界 (ErrorBoundary) ---------------- */

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
}

export class EdenErrorBoundary extends React.Component<PropsWithChildren, ErrorBoundaryState> {
  constructor(props: PropsWithChildren) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("EdenResidence Uncaught Error:", error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "#0d1015",
          color: "#edeae0",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "32px",
          fontFamily: "monospace",
          textAlign: "center",
          zIndex: 99999
        }}>
          <div style={{ fontSize: "11px", letterSpacing: "0.2em", color: "#e3b377", marginBottom: "12px" }}>
            // EDEN SIGNAL INTERRUPTED
          </div>
          <div style={{ fontSize: "20px", fontWeight: "bold", color: "#f4efe6", marginBottom: "16px" }}>
            居所信号保护中
          </div>
          <div style={{ fontSize: "12px", color: "#8c9dae", maxWidth: "420px", lineHeight: 1.6, marginBottom: "24px" }}>
            渲染层捕获到异常状态：{this.state.error?.message || "Unknown error"}。居所已启动离线快照隔离，点击下方按钮重置信号。
          </div>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: "10px 24px",
              borderRadius: "20px",
              background: "#7fb8c7",
              color: "#0d1015",
              border: "none",
              fontWeight: 600,
              cursor: "pointer"
            }}
          >
            重新校准居所信号 ↗
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
