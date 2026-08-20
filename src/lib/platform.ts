import Taro from "@tarojs/taro"

export type MiniRuntimePlatform = "h5" | "weapp" | "tt" | "unknown"

export type VibeXMiniExtConfig = {
  appid?: string
  vibexAppId?: string
  vibexApiBase?: string
  vibexPreviewUrl?: string
  previewUrl?: string
}

export function getRuntimePlatform(): MiniRuntimePlatform {
  const env = Taro.getEnv()
  if (env === Taro.ENV_TYPE.WEB) return "h5"
  if (env === Taro.ENV_TYPE.WEAPP) return "weapp"
  if (env === Taro.ENV_TYPE.TT) return "tt"
  return "unknown"
}

export function isH5Runtime(): boolean {
  return getRuntimePlatform() === "h5"
}

export function isMiniRuntime(): boolean {
  return !isH5Runtime()
}

export function isWechatRuntime(): boolean {
  return getRuntimePlatform() === "weapp"
}

export function isDouyinRuntime(): boolean {
  return getRuntimePlatform() === "tt"
}

export function getMiniExtConfig(): VibeXMiniExtConfig {
  if (isH5Runtime()) return {}
  try {
    const api = Taro as unknown as { getExtConfigSync?: () => Record<string, unknown> }
    const raw = api.getExtConfigSync?.() ?? {}
    const ext = (raw.ext && typeof raw.ext === "object" ? raw.ext : raw) as Record<string, unknown>
    return {
      appid: typeof ext.appid === "string" ? ext.appid : undefined,
      vibexAppId: typeof ext.vibexAppId === "string" ? ext.vibexAppId : undefined,
      vibexApiBase: typeof ext.vibexApiBase === "string" ? ext.vibexApiBase : undefined,
      vibexPreviewUrl: typeof ext.vibexPreviewUrl === "string" ? ext.vibexPreviewUrl : undefined,
      previewUrl: typeof ext.previewUrl === "string" ? ext.previewUrl : undefined,
    }
  } catch {
    return {}
  }
}

export function getH5VibeXRoutePrefix(): string {
  if (!isH5Runtime()) return ""
  if (typeof window === "undefined") return ""
  const match = window.location.pathname.match(/^\/(?:app-preview|p)\/app-[0-9a-f]{32}(?=\/|$)/)
  return match ? match[0] : ""
}

export function getH5VibeXAppId(): string {
  const prefix = getH5VibeXRoutePrefix()
  const match = prefix.match(/app-[0-9a-f]{32}/)
  return match ? match[0] : ""
}

export function getVibeXAppId(): string {
  return getMiniExtConfig().vibexAppId || getH5VibeXAppId()
}

export function getVibeXApiBase(): string {
  const fromExt = getMiniExtConfig().vibexApiBase
  if (fromExt) return fromExt.replace(/\/$/, "")
  if (isH5Runtime() && typeof window !== "undefined") return window.location.origin
  return ""
}

export function assertMiniSupportedApiBase(): string {
  const base = getVibeXApiBase()
  if (!base) {
    throw new Error("VibeX mini program API base is missing. Please regenerate preview code with ext.vibexApiBase.")
  }
  return base
}
