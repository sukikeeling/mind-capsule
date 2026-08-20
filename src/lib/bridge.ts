import Taro from "@tarojs/taro"

export interface EdenApiConfig {
  apiKey: string
  baseUrl: string
  model: string
  enabled: boolean
}

const STORAGE_KEY = "eden_api_config"

export const DEFAULT_API_CONFIG: EdenApiConfig = {
  apiKey: "",
  baseUrl: "https://api.openai.com/v1",
  model: "claude-sonnet-4.6",
  enabled: false,
}

export function loadApiConfig(): EdenApiConfig {
  try {
    const raw = Taro.getStorageSync(STORAGE_KEY)
    if (!raw) return DEFAULT_API_CONFIG
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw
    return {
      apiKey: String(parsed.apiKey ?? ""),
      baseUrl: String(parsed.baseUrl ?? DEFAULT_API_CONFIG.baseUrl),
      model: String(parsed.model ?? DEFAULT_API_CONFIG.model),
      enabled: Boolean(parsed.enabled),
    }
  } catch {
    return DEFAULT_API_CONFIG
  }
}

export function saveApiConfig(cfg: EdenApiConfig): void {
  try {
    Taro.setStorageSync(STORAGE_KEY, cfg)
  } catch {
    /* fallback */
  }
}

export async function testApiConnection(cfg: EdenApiConfig): Promise<{ ok: boolean; message: string }> {
  if (!cfg.apiKey) {
    return { ok: false, message: "请输入 API Key" }
  }
  const url = cfg.baseUrl.replace(/\/+$/, "") + "/chat/completions"
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${cfg.apiKey.trim()}`,
      },
      body: JSON.stringify({
        model: cfg.model || "gpt-3.5-turbo",
        messages: [{ role: "user", content: "ping" }],
        max_tokens: 5,
      }),
    })
    if (res.ok) {
      return { ok: true, message: "信号连接成功 · API READY" }
    }
    const errText = await res.text().catch(() => "")
    return { ok: false, message: `连接失败 (${res.status}): ${errText.slice(0, 80)}` }
  } catch (err: any) {
    return { ok: false, message: `网络异常: ${err?.message || "无法连接到服务器"}` }
  }
}

export interface ChatMessagePayload {
  role: "system" | "user" | "assistant"
  content: string
}

export async function callEdenAiStream(
  messages: ChatMessagePayload[],
  onChunk: (chunk: string) => void,
  signal?: AbortSignal,
): Promise<{ ok: boolean; fullText: string; error?: string }> {
  const cfg = loadApiConfig()

  if (!cfg.enabled || !cfg.apiKey) {
    return { ok: false, fullText: "", error: "api_not_configured" }
  }

  const url = cfg.baseUrl.replace(/\/+$/, "") + "/chat/completions"
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${cfg.apiKey.trim()}`,
      },
      body: JSON.stringify({
        model: cfg.model || "claude-3-5-sonnet-20241022",
        messages,
        max_tokens: 1024,
        stream: true,
      }),
      signal,
    })

    if (!res.ok) {
      const errText = await res.text().catch(() => "")
      return { ok: false, fullText: "", error: `HTTP ${res.status}: ${errText.slice(0, 100)}` }
    }

    if (!res.body) {
      return { ok: false, fullText: "", error: "No response body" }
    }

    const reader = res.body.getReader()
    const decoder = new TextDecoder("utf-8")
    let fullText = ""
    let buffer = ""

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split("\n")
      buffer = lines.pop() || ""

      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed || trimmed.startsWith(":") || !trimmed.startsWith("data:")) continue
        const dataStr = trimmed.slice(5).trim()
        if (dataStr === "[DONE]") continue
        try {
          const parsed = JSON.parse(dataStr)
          const delta = parsed.choices?.[0]?.delta?.content || ""
          if (delta) {
            fullText += delta
            onChunk(delta)
          }
        } catch {
          /* ignore parse error on partial chunks */
        }
      }
    }

    return { ok: true, fullText }
  } catch (err: any) {
    return { ok: false, fullText: "", error: err?.message || "Network stream error" }
  }
}
