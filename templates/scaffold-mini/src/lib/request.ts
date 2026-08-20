import Taro from "@tarojs/taro"
import { getRunningHubAuthHeaders } from "./miniAuth"
import { getH5VibeXRoutePrefix, getVibeXApiBase, getVibeXAppId, isH5Runtime } from "./platform"

export type RequestMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE"

export type MiniRequestOptions = {
  method?: RequestMethod
  data?: unknown
  header?: Record<string, string>
  timeout?: number
}

export class MiniRequestError extends Error {
  statusCode: number
  data: unknown

  constructor(message: string, statusCode: number, data: unknown) {
    super(message)
    this.name = "MiniRequestError"
    this.statusCode = statusCode
    this.data = data
  }
}

function trimRightSlash(value: string): string {
  return value.replace(/\/+$/, "")
}

function trimLeftSlash(value: string): string {
  return value.replace(/^\/+/, "")
}

function joinUrl(base: string, path: string): string {
  if (/^https?:\/\//i.test(path)) return path
  if (!base) return path.startsWith("/") ? path : `/${path}`
  return dedupeAppPreviewPrefix(`${trimRightSlash(base)}/${trimLeftSlash(path)}`)
}

// Defensive guard: collapse an accidentally-doubled "/app-preview/<appId>" or "/p/<appId>"
// segment (e.g. "/app-preview/app-xxx/app-preview/app-xxx/__pb/...") into a single occurrence.
function dedupeAppPreviewPrefix(url: string): string {
  return url.replace(/((?:\/app-preview|\/p)\/app-[0-9a-f]{32})\1+/, "$1")
}

function isTrustedRhUrl(url: string): boolean {
  if (url.startsWith("/")) return true
  try {
    const parsed = new URL(url, getVibeXApiBase() || "https://www.runninghub.cn")
    const host = parsed.hostname.toLowerCase()
    return host === "runninghub.cn" || host.endsWith(".runninghub.cn")
  } catch {
    return false
  }
}

function buildHeaders(url: string, header?: Record<string, string>): Record<string, string> {
  return {
    "content-type": "application/json",
    ...(isTrustedRhUrl(url) ? getRunningHubAuthHeaders() : {}),
    ...(header ?? {}),
  }
}

export function getPocketBaseUrl(): string {
  if (isH5Runtime()) {
    const prefix = getH5VibeXRoutePrefix()
    const origin = typeof window !== "undefined" ? window.location.origin : ""
    return prefix ? `${origin}${prefix}/__pb` : `${origin}/__pb`
  }

  const base = getVibeXApiBase()
  const appId = getVibeXAppId()
  if (!base || !appId) return ""
  // `base` may already carry the app-scoped "/app-preview/<appId>" prefix (VibeX ext config
  // sometimes provides a pre-scoped base). Only append the prefix if it isn't already there,
  // otherwise the resulting URL doubles the "/app-preview/<appId>" segment.
  const trimmedBase = trimRightSlash(base)
  if (trimmedBase.includes(`/app-preview/${appId}`) || trimmedBase.includes(`/p/${appId}`)) {
    return `${trimmedBase}/__pb`
  }
  return `${trimmedBase}/app-preview/${appId}/__pb`
}

export function resolveVibeXUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path
  const base = isH5Runtime() ? "" : getVibeXApiBase()
  return joinUrl(base, path)
}

export function resolvePocketBaseUrl(path: string): string {
  const base = getPocketBaseUrl()
  if (!base) {
    throw new Error("PocketBase proxy is not configured for this mini program preview.")
  }
  return joinUrl(base, path)
}

export async function requestJson<T>(path: string, options: MiniRequestOptions = {}): Promise<T> {
  const method = options.method ?? "GET"
  const url = resolveVibeXUrl(path)
  const response = await Taro.request({
    url,
    method: method as any,
    data: options.data,
    header: buildHeaders(url, options.header),
    timeout: options.timeout ?? 30000,
  })

  const statusCode = response.statusCode ?? 0
  if (statusCode < 200 || statusCode >= 300) {
    throw new MiniRequestError(`HTTP ${statusCode}`, statusCode, response.data)
  }
  return response.data as T
}

export async function pbRequest<T>(path: string, options: MiniRequestOptions = {}): Promise<T> {
  const method = options.method ?? "GET"
  const url = resolvePocketBaseUrl(path)
  const response = await Taro.request({
    url,
    method: method as any,
    data: options.data,
    header: buildHeaders(url, options.header),
    timeout: options.timeout ?? 30000,
  })

  const statusCode = response.statusCode ?? 0
  if (statusCode < 200 || statusCode >= 300) {
    throw new MiniRequestError(`PB HTTP ${statusCode}`, statusCode, response.data)
  }
  return response.data as T
}
