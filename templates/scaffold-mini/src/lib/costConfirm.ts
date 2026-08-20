import Taro from "@tarojs/taro"
import { getVibeXAppId } from "./platform"

export function currentVibexAppId(): string {
  return getVibeXAppId() || "local"
}

export function costConfirmStorageKey(appId: string): string {
  return `vibex_cost_confirmed_today:${appId}`
}

function endOfTodayMs(): number {
  const d = new Date()
  d.setHours(23, 59, 59, 999)
  return d.getTime()
}

export function hasCostConfirmedToday(appId: string): boolean {
  try {
    const raw = Taro.getStorageSync<string>(costConfirmStorageKey(appId))
    if (!raw) return false
    const data = JSON.parse(raw) as { expiresAt?: number }
    return typeof data.expiresAt === "number" && data.expiresAt > Date.now()
  } catch {
    return false
  }
}

export function rememberCostConfirmedToday(appId: string): void {
  try {
    Taro.setStorageSync(costConfirmStorageKey(appId), JSON.stringify({ expiresAt: endOfTodayMs() }))
  } catch {
    // ignore storage failures; the confirmation still continues for this tap.
  }
}
