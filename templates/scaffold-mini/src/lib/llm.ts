import { MiniRequestError, pbRequest } from "./request"

export type LlmContentPart =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } }

export interface LlmMessage {
  role: "system" | "user" | "assistant"
  content: string | LlmContentPart[]
}

export interface LlmCallOptions {
  messages: LlmMessage[]
  page?: string
  max_tokens?: number
  temperature?: number
  signal?: AbortSignal
  request_id?: string
}

export interface LlmCallResult {
  ok: boolean
  status: "success" | "failed" | "running" | "pending" | "not_found"
  text: string
  error?: string
  model?: string
  usage?: unknown
  needsLogin?: boolean
}

export interface LlmModelInfo {
  model: string
  rh_model_id: string
  max_tokens: number
  timeout_s: number
  supports_temperature: boolean
}

const CHAT_TIMEOUT_MS = 25000
const POLL_INTERVAL_MS = 3000
const POLL_ATTEMPTS = 200

function uuid(): string {
  return `req-${Date.now().toString(16)}-${Math.random().toString(16).slice(2, 10)}`
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null
}

function readString(source: unknown, keys: string[]): string {
  const record = asRecord(source)
  if (!record) return ""
  for (const key of keys) {
    const value = record[key]
    if (typeof value === "string" && value.trim()) return value.trim()
    if (typeof value === "number") return String(value)
  }
  return ""
}

function isLoginRequiredData(data: unknown): boolean {
  const value = readString(data, ["error", "code", "message"])
  return value === "rh_login_required" || value.includes("登录态已过期")
}

function loginRequiredResult(data?: unknown): LlmCallResult {
  return {
    ok: false,
    status: "failed",
    text: "",
    error: readString(data, ["message", "error"]) || "rh_login_required",
    needsLogin: true,
  }
}

function normalizeResult(data: unknown, fallbackStatus: LlmCallResult["status"]): LlmCallResult {
  const record = asRecord(data) ?? {}
  if (isLoginRequiredData(record)) return loginRequiredResult(record)
  const status = readString(record, ["status"]) as LlmCallResult["status"]
  return {
    ok: Boolean(record.ok),
    status: status || fallbackStatus,
    text: readString(record, ["text", "content", "message"]),
    error: readString(record, ["error"]),
    model: readString(record, ["model"]),
    usage: record.usage,
  }
}

function isLoginRequiredError(error: unknown): error is MiniRequestError {
  return error instanceof MiniRequestError && (error.statusCode === 412 || isLoginRequiredData(error.data))
}

async function pollOnce(requestId: string): Promise<LlmCallResult> {
  try {
    const data = await pbRequest<unknown>("/api/llm/poll", {
      method: "POST",
      data: { request_id: requestId },
      timeout: 30000,
    })
    return normalizeResult(data, "running")
  } catch (error) {
    if (isLoginRequiredError(error)) return loginRequiredResult(error.data)
    return { ok: false, status: "running", text: "", error: "" }
  }
}

export async function callLlmWithFallback(modelName: string, opts: LlmCallOptions): Promise<LlmCallResult> {
  const requestId = opts.request_id || uuid()
  if (opts.signal?.aborted) return { ok: false, status: "failed", text: "", error: "aborted" }

  const payload: Record<string, unknown> = {
    model: modelName,
    messages: opts.messages,
    page: opts.page || "",
    max_tokens: opts.max_tokens,
    request_id: requestId,
  }
  if (opts.temperature !== undefined && opts.temperature !== null && !/gpt-?5/i.test(modelName)) {
    payload.temperature = opts.temperature
  }

  try {
    const data = await pbRequest<unknown>("/api/llm/chat", {
      method: "POST",
      data: payload,
      timeout: CHAT_TIMEOUT_MS,
    })
    const result = normalizeResult(data, "success")
    if (result.needsLogin || result.status === "success" || result.status === "failed") return result
  } catch (error) {
    if (isLoginRequiredError(error)) return loginRequiredResult(error.data)
  }

  let notFoundCount = 0
  for (let i = 0; i < POLL_ATTEMPTS; i += 1) {
    if (opts.signal?.aborted) return { ok: false, status: "failed", text: "", error: "aborted" }
    await sleep(POLL_INTERVAL_MS)
    const result = await pollOnce(requestId)
    if (result.needsLogin) return result
    if (result.status === "success" || result.status === "failed") return result
    if (result.status === "not_found") {
      notFoundCount += 1
      if (notFoundCount >= 3) return { ok: false, status: "failed", text: "", error: "not_found" }
    } else {
      notFoundCount = 0
    }
  }
  return { ok: false, status: "failed", text: "", error: "timeout" }
}

export async function listLlmModels(): Promise<LlmModelInfo[]> {
  try {
    const data = await pbRequest<{ models?: LlmModelInfo[] }>("/api/llm/models", { method: "GET" })
    return Array.isArray(data.models) ? data.models : []
  } catch {
    return []
  }
}
