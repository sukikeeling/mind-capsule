import Taro from "@tarojs/taro"
import { getRunningHubAuthHeaders } from "./miniAuth"
import { MiniRequestError, pbRequest, resolvePocketBaseUrl } from "./request"

export interface AigcOutput {
  url: string
  type: "image" | "video" | "audio" | "3d" | "file"
}

export interface AigcResponse<T = unknown> {
  taskId?: string
  task_id?: string
  rhTaskId?: string
  results?: T[]
  outputs?: AigcOutput[]
  [key: string]: unknown
}

export type AiAppOutput = {
  id?: string
  type: "image" | "video" | "audio" | "text" | "file"
  url: string
  text?: string
  fileType?: string
  filename?: string
  nodeId?: string
}

export type AigcUsage = {
  consumeMoney: string | null
  consumeCoins: string | null
  taskCostTime: string | null
  thirdPartyConsumeMoney: string | null
}

export type AiAppRunResponse = {
  ok: boolean
  version: "rh-ai-app.v1"
  state: "queued" | "running" | "succeeded" | "failed" | "partial"
  job?: { jobId: string; taskId: string; state: string }
  outputs?: AiAppOutput[]
  results?: AiAppOutput[]
  usage?: AigcUsage
  error?: { code: string; message: string; retryable: boolean; taskId: string; failedNode?: unknown }
}

export type AigcPricePreview = {
  ok: boolean
  estimatedPrice?: number
  currency?: string
  priceText?: string
  freeLimit?: boolean
  isFreeThisCall?: boolean
  message?: string
}

export type AiAppUploadResponse = {
  ok: boolean
  fileName: string
}

export type AigcUploadResponse = {
  ok: boolean
  type: string
  download_url: string
  downloadUrl: string
  fileName: string
  size?: string
}

export interface AigcScalarParam {
  name: string
  type?: "string" | "bool" | "number"
  required?: boolean
  enum?: string[]
  default?: string | number | boolean
}

export interface AigcMediaParam {
  name: string
  type?: "image" | "video" | "audio" | "zip"
  required?: boolean
  multiple?: boolean
  max_num?: number
  accept?: string
  max_size?: number
}

export interface AigcModelInfo {
  model: string
  endpoint: string
  output_type: "image" | "video" | "audio" | "3d" | "file"
  primary_input?: { name: string; required?: boolean } | null
  scalar_params?: AigcScalarParam[]
  media_params?: AigcMediaParam[]
}

export interface AigcHistoryItem {
  jobId: string
  taskId: string
  status: string
  page: string
  prompt: string
  resultUrl: string
  errorMessage: string
  rating: number
  favorite: boolean
  category: string
  note: string
  created: string
  updated: string
  // 提交时用的 RH 模型短名 (resumeAigcJob 恢复轮询时用它选 8/30 分钟 deadline)。
  model?: string
  consumeMoney: string
  consumeCoins: string
  taskCostTime: string
  thirdPartyConsumeMoney: string
}

export interface AigcHistoryQuery {
  page?: number
  perPage?: number
  status?: string
  favorite?: boolean
  category?: string
  minRating?: number
  sort?: "newest" | "oldest" | "rating" | "favorite"
}

export type AigcHistoryPatch = Partial<Pick<AigcHistoryItem, "rating" | "favorite" | "category" | "note">>

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function parseUploadData<T>(data: unknown): T {
  if (typeof data === "string") return JSON.parse(data) as T
  return data as T
}

async function uploadFile<T>(url: string, filePath: string, formData: Record<string, string>): Promise<T> {
  const response = await Taro.uploadFile({
    url,
    filePath,
    name: "file",
    formData,
    header: getRunningHubAuthHeaders(),
  })
  const statusCode = response.statusCode ?? 0
  if (statusCode < 200 || statusCode >= 300) {
    throw new MiniRequestError(`Upload HTTP ${statusCode}`, statusCode, response.data)
  }
  return parseUploadData<T>(response.data)
}

export async function callAigc<T = unknown>(path: string, body: unknown): Promise<AigcResponse<T>> {
  const apiPath = path.startsWith("/") ? path : `/${path}`
  return pbRequest<AigcResponse<T>>(apiPath, {
    method: "POST",
    data: body,
  })
}

export async function callAiApp<T>(path: string, body: unknown): Promise<T> {
  return (await callAigc(path, body)) as unknown as T
}

export async function uploadAigcMedia(
  filePath: string,
  fileType: "image" | "audio" | "video" | "zip" = "image",
): Promise<AigcUploadResponse> {
  return uploadFile<AigcUploadResponse>(resolvePocketBaseUrl("/api/aigc/upload"), filePath, { fileType })
}

export async function uploadAigcMediaFiles(
  filePaths: string[],
  fileType: "image" | "audio" | "video" | "zip" = "image",
  opts?: { maxCount?: number },
): Promise<string[]> {
  const capped = opts?.maxCount ? filePaths.slice(0, opts.maxCount) : filePaths
  const results: string[] = []
  for (let index = 0; index < capped.length; index += 1) {
    if (index > 0) await sleep(300)
    try {
      const item = await uploadAigcMedia(capped[index], fileType)
      if (item.downloadUrl) results.push(item.downloadUrl)
    } catch {
      // Keep the rest of the batch usable if one selected file fails.
    }
  }
  return results
}

export async function uploadAiAppMedia(
  slug: string,
  filePath: string,
  fileType: "image" | "audio" | "video",
): Promise<AiAppUploadResponse> {
  const url = `${resolvePocketBaseUrl(`/api/aigc/ai-app/${slug}/upload`)}?fileType=${encodeURIComponent(fileType)}`
  return uploadFile<AiAppUploadResponse>(url, filePath, { fileType })
}

export async function listAigcModels(): Promise<AigcModelInfo[]> {
  try {
    const data = await pbRequest<{ models?: AigcModelInfo[] }>("/api/aigc/models", { method: "GET" })
    return Array.isArray(data.models) ? data.models : []
  } catch {
    return []
  }
}

export async function getAigcModelInfo(modelName: string): Promise<AigcModelInfo | null> {
  const models = await listAigcModels()
  return models.find((model) => model.model === modelName) || null
}

// RH 有时只回 estimatedPrice、不回 priceText。页面必须用本 helper，禁止只判断 r.priceText。
export function formatAigcPricePreview(r: AigcPricePreview | null | undefined): string | null {
  if (!r || !r.ok) return null
  if (r.isFreeThisCall) return "本次免费"
  const text = typeof r.priceText === "string" ? r.priceText.trim() : ""
  if (text) return text
  if (typeof r.estimatedPrice === "number" && Number.isFinite(r.estimatedPrice)) {
    const currency = (r.currency || "CNY").trim() || "CNY"
    return `约 ${r.estimatedPrice} ${currency}`
  }
  return null
}

export async function previewAigcPrice(modelName: string, body: unknown): Promise<AigcPricePreview> {
  try {
    return await pbRequest<AigcPricePreview>("/api/aigc/price-preview", {
      method: "POST",
      data: { ...((body || {}) as Record<string, unknown>), model: modelName },
    })
  } catch (error) {
    return { ok: false, message: String((error as Error)?.message || error) }
  }
}

export async function previewAiAppPrice(slug: string, body: unknown): Promise<AigcPricePreview> {
  try {
    return await callAiApp<AigcPricePreview>(`/api/aigc/ai-app/${slug}/price-preview`, body)
  } catch (error) {
    return { ok: false, message: String((error as Error)?.message || error) }
  }
}

export async function loadAigcHistory(
  modelName: string,
  opts?: AigcHistoryQuery,
): Promise<AigcHistoryItem[]> {
  try {
    const data = await callAigc<{ items?: AigcHistoryItem[] }>("/api/aigc/history", {
      page: opts?.page ?? 1,
      perPage: opts?.perPage ?? 20,
      status: opts?.status,
      favorite: opts?.favorite,
      category: opts?.category,
      minRating: opts?.minRating,
      sort: opts?.sort,
      model: modelName,
    })
    const items = (data as unknown as { items?: AigcHistoryItem[] }).items
    return Array.isArray(items) ? items : []
  } catch {
    return []
  }
}

export async function updateAigcHistoryItem(
  modelName: string,
  jobId: string,
  patch: AigcHistoryPatch,
): Promise<AigcHistoryItem | null> {
  const data = await callAigc<{ item?: AigcHistoryItem }>(
    `/api/aigc/history/${encodeURIComponent(jobId)}/update`,
    { ...patch, model: modelName },
  )
  return (data as unknown as { item?: AigcHistoryItem }).item || null
}

export async function deleteAigcHistoryItem(modelName: string, jobId: string): Promise<boolean> {
  const data = await callAigc(`/api/aigc/history/${encodeURIComponent(jobId)}/delete`, { model: modelName })
  return Boolean((data as unknown as { deleted?: boolean }).deleted)
}

export async function updateAiAppHistoryItem(
  slug: string,
  jobId: string,
  patch: AigcHistoryPatch,
): Promise<AigcHistoryItem | null> {
  const data = await callAiApp<{ ok: boolean; item?: AigcHistoryItem }>(
    `/api/aigc/ai-app/${slug}/history/${encodeURIComponent(jobId)}/update`,
    patch,
  )
  return data.item || null
}

export async function deleteAiAppHistoryItem(slug: string, jobId: string): Promise<boolean> {
  const data = await callAiApp<{ ok: boolean; deleted?: boolean }>(
    `/api/aigc/ai-app/${slug}/history/${encodeURIComponent(jobId)}/delete`,
    {},
  )
  return Boolean(data.deleted)
}

// ============ 提交 + 轮询 + 恢复 helper (与 web 版 scaffold 的 aigc.ts 语义一致, 传输层换成
// pbRequest/Taro)。页面不要自己写 while poll 循环。 ============

// Taro 环境未必有 DOM AbortSignal, 用结构化最小类型。
export type AigcAbortLike = { aborted?: boolean }

export interface AigcSubmitResponse {
  ok: boolean
  taskId: string
  rhTaskId?: string
  status?: "running" | "queued" | "success" | "failed"
  model?: string
  error?: string
  errorCode?: string
  message?: string
}

export interface AigcPollResponse {
  ok: boolean
  taskId: string
  status: "RUNNING" | "QUEUED" | "SUCCESS" | "FAILED" | "CANCEL"
  outputs?: AigcOutput[]
  model?: string
  error?: string
  message?: string
  usage?: AigcUsage
}

export interface AigcSuccess {
  status: "success"
  taskId: string
  rhTaskId?: string
  outputs: AigcOutput[]
  url: string
  model?: string
  usage?: AigcUsage
}

export interface AigcFailure {
  status: "failed"
  taskId?: string
  error: string
  errorKind:
    | "submit"
    | "poll"
    | "timeout"
    | "aborted"
    | "login_required"
    | "insufficient_balance"
    | "content_audit"
    | "task_failed"
  needsLogin?: boolean
  usage?: AigcUsage
}

export type AigcResult = AigcSuccess | AigcFailure

const LOGIN_REQUIRED_ZH = "请先登录 RunningHub 后再生成"

const AIGC_ERROR_MESSAGES_ZH: Record<AigcFailure["errorKind"], string> = {
  submit: "提交生成任务失败 (网络或服务器繁忙), 请稍后重试",
  poll: "查询生成结果失败, 请稍后重试",
  timeout: "AI 生成超时 (可能服务器繁忙), 请稍后重试",
  aborted: "已取消",
  login_required: LOGIN_REQUIRED_ZH,
  insufficient_balance: "RunningHub 账户余额不足, 请充值后重试",
  content_audit: "内容审核未通过",
  task_failed: "生成失败, 请稍后重试或换个 prompt",
}

const AIGC_ERROR_PLACEHOLDER_VALUES = new Set([
  "aborted",
  "submit failed",
  "poll timeout",
  "task_failed",
  "rh_login_required",
  "login_required",
])

function authFailureHaystack(...parts: unknown[]): string {
  return parts
    .map((part) => {
      if (part == null) return ""
      if (typeof part === "string") return part
      try {
        return JSON.stringify(part)
      } catch {
        return String(part)
      }
    })
    .join(" ")
    .toLowerCase()
}

// 发布沙箱未登录 → control 401 {detail:{code:"SANDBOX_TOKEN_REQUIRED"}};
// RH key/登录态失效 → hook 412 rh_login_required。两者都要引导登录, 不能落成"网络繁忙"。
function isLoginRequiredSignal(status: number, ...parts: unknown[]): boolean {
  if (status === 412 || status === 401) return true
  const hay = authFailureHaystack(...parts)
  return (
    hay.includes("sandbox_token_required") ||
    hay.includes("sandbox_api_key_missing") ||
    hay.includes("rh_login_required") ||
    hay.includes("login_required") ||
    hay.includes("登录态已过期") ||
    hay.includes("请先登录")
  )
}

function loginRequiredFailure(opts?: { taskId?: string; error?: string }): AigcFailure {
  return {
    status: "failed",
    taskId: opts?.taskId,
    errorKind: "login_required",
    error: opts?.error || "rh_login_required",
    needsLogin: true,
  }
}

// AigcFailure → 中文详情的默认安全格式化。对**所有** errorKind 都把 RunningHub 返回的真实原因
// 拼在中文文案后面, 不做 errorKind 白名单挑着拼 —— 漏掉的分支会吞掉真实报错。
// login_required 只展示引导文案, 不拼 SANDBOX_TOKEN_REQUIRED 之类的技术码。
export function formatAigcFailureMessage(result: AigcFailure): string {
  const base = AIGC_ERROR_MESSAGES_ZH[result.errorKind] || "生成失败, 请重试"
  if (result.errorKind === "login_required") return base
  const raw = result.error
  if (raw && !AIGC_ERROR_PLACEHOLDER_VALUES.has(raw) && raw !== base) {
    return `${base}: ${raw}`
  }
  return base
}

// 视频 / 音频 / 3D 这类重任务用 30 分钟 deadline, 其余 8 分钟。
function _isLongRunningModel(modelName: string): boolean {
  const m = modelName.toLowerCase()
  return (
    m.includes("seedance") ||
    m.includes("sparkvideo") ||
    m.includes("happyhorse") ||
    m.includes("video") ||
    m.includes("audio") ||
    m.includes("music") ||
    m.includes("mureka") ||
    m.includes("song") ||
    m.includes("3d") ||
    m.includes("mesh") ||
    m.includes("hunyuan3d") ||
    m.includes("meshy") ||
    m.includes("marble")
  )
}

function classifySubmitBusinessError(data: Partial<AigcSubmitResponse> | null, fallback = ""): AigcFailure | null {
  const code = String(data?.errorCode || "")
  const rawError = String(data?.error || "")
  const message = String(data?.message || fallback || rawError || "")
  if (isLoginRequiredSignal(0, code, rawError, message, fallback, data)) {
    return loginRequiredFailure({ error: "rh_login_required" })
  }
  const hay = `${code} ${rawError} ${message}`.toLowerCase()
  if (
    rawError === "rh_insufficient_balance" ||
    code === "605" ||
    hay.includes("insufficient") ||
    hay.includes("balance") ||
    hay.includes("余额") ||
    hay.includes("点数") ||
    hay.includes("积分")
  ) {
    return { status: "failed", errorKind: "insufficient_balance", error: message || "RunningHub 账户余额不足" }
  }
  if (
    rawError === "rh_content_audit" ||
    /content security audit|内容安全审查|内容审查|审核未通过|content moderation/i.test(message)
  ) {
    return { status: "failed", errorKind: "content_audit", error: message || "内容审核未通过" }
  }
  if (rawError || code || message) {
    return { status: "failed", errorKind: "submit", error: message || rawError || "submit failed" }
  }
  return null
}

// 共享 poll 循环, 被 callAigcAndPoll 和 resumeAigcJob 复用 —— 轮询/超时/错误映射语义必须一致。
async function pollAigcToResult(
  taskId: string,
  opts: {
    pollIntervalMs?: number
    deadlineMs?: number
    signal?: AigcAbortLike
    rhTaskId?: string
    model?: string
  },
): Promise<AigcResult> {
  const defaultDeadline = _isLongRunningModel(opts.model || "") ? 30 * 60_000 : 8 * 60_000
  const deadline = Date.now() + (opts.deadlineMs ?? defaultDeadline)
  let interval = opts.pollIntervalMs ?? 2500

  while (Date.now() < deadline) {
    if (opts.signal?.aborted) {
      return { status: "failed", taskId, errorKind: "aborted", error: "aborted" }
    }
    await sleep(interval)
    interval = Math.min(interval + 500, 5000)

    let data: AigcPollResponse
    try {
      data = await pbRequest<AigcPollResponse>(`/api/aigc/jobs/${encodeURIComponent(taskId)}/poll`, {
        method: "POST",
        data: {},
      })
    } catch (e) {
      const status = e instanceof MiniRequestError ? e.statusCode : 0
      const errData = e instanceof MiniRequestError ? e.data : undefined
      if (isLoginRequiredSignal(status, errData, String((e as Error)?.message || e))) {
        const body = errData as { message?: string; error?: string } | undefined
        return loginRequiredFailure({
          taskId,
          error: body?.message || body?.error || "rh_login_required",
        })
      }
      // 网络抖动 / PB 重启窗口 / 瞬时 5xx → 当作 RUNNING, 继续 poll
      continue
    }

    const status = String(data.status || "RUNNING").toUpperCase()
    if (status === "SUCCESS") {
      const outputs = data.outputs || []
      const first = outputs.find((o) => !o.type || o.type === "image" || o.type === "video") || outputs[0]
      return {
        status: "success",
        taskId,
        rhTaskId: opts.rhTaskId,
        outputs,
        url: first?.url || "",
        model: data.model || opts.model,
        usage: data.usage,
      }
    }
    if (status === "FAILED" || status === "CANCEL") {
      const errMsg = (data.error || data.message || "task_failed") as string
      const isContentAudit =
        /content security audit|内容安全审查|内容审查|审核未通过|content moderation/i.test(errMsg)
      return {
        status: "failed",
        taskId,
        errorKind: isContentAudit ? "content_audit" : "task_failed",
        error: errMsg,
        usage: data.usage,
      }
    }
    // RUNNING / QUEUED → 继续 loop
  }

  return { status: "failed", taskId, errorKind: "timeout", error: "poll timeout" }
}

// 提交 + 自动 poll, 一次调用拿到出图 / 视频 URL. 失败 / 超时 / 412 全部返回结构化 AigcResult, **不 throw**.
export async function callAigcAndPoll(
  modelName: string,
  body: unknown,
  opts?: { pollIntervalMs?: number; deadlineMs?: number; signal?: AigcAbortLike },
): Promise<AigcResult> {
  const submitBody = { ...((body || {}) as Record<string, unknown>), model: modelName }

  // submit 撞 PB 热重载窗口时会拿到网络错 / 5xx, 等 1.5s retry, 最多 3 次。
  let sub: AigcSubmitResponse | null = null
  let lastSubmitErr = ""
  for (let attempt = 0; attempt < 3; attempt++) {
    if (opts?.signal?.aborted) {
      return { status: "failed", errorKind: "aborted", error: "aborted" }
    }
    try {
      sub = await pbRequest<AigcSubmitResponse>("/api/aigc/submit", { method: "POST", data: submitBody })
      break
    } catch (e) {
      const status = e instanceof MiniRequestError ? e.statusCode : 0
      const errData = e instanceof MiniRequestError ? (e.data as Partial<AigcSubmitResponse> | null) : null
      if (isLoginRequiredSignal(status, errData, String((e as Error)?.message || e))) {
        const body = errData as { message?: string; error?: string } | null
        return loginRequiredFailure({ error: body?.message || body?.error || "rh_login_required" })
      }
      // 4xx 业务错不重试
      if (status >= 400 && status < 500) {
        const businessErr = classifySubmitBusinessError(errData, String((e as Error)?.message || ""))
        if (businessErr) return businessErr
        return { status: "failed", errorKind: "submit", error: `submit HTTP ${status}` }
      }
      lastSubmitErr = String((e as Error)?.message || e)
      if (attempt < 2) {
        await sleep(1500)
        continue
      }
      return { status: "failed", errorKind: "submit", error: lastSubmitErr }
    }
  }

  if (!sub) {
    return { status: "failed", errorKind: "submit", error: lastSubmitErr || "submit failed" }
  }
  const taskId = sub.taskId
  if (!taskId) {
    const businessErr = classifySubmitBusinessError(sub)
    if (businessErr) return businessErr
    return { status: "failed", errorKind: "submit", error: "submit returned no taskId" }
  }

  return pollAigcToResult(taskId, {
    pollIntervalMs: opts?.pollIntervalMs,
    deadlineMs: opts?.deadlineMs,
    signal: opts?.signal,
    rhTaskId: sub.rhTaskId,
    model: sub.model || modelName,
  })
}

// 恢复一个已提交、还没跑到终态的任务的 poll —— 页面挂载时把 loadAigcHistory() 里
// status === "running" 的历史项接着跑完, 不让刷新/重开后进行中任务变孤儿。
export async function resumeAigcJob(
  item: { jobId: string; model?: string },
  opts?: { pollIntervalMs?: number; deadlineMs?: number; signal?: AigcAbortLike },
): Promise<AigcResult> {
  return pollAigcToResult(item.jobId, {
    pollIntervalMs: opts?.pollIntervalMs,
    deadlineMs: opts?.deadlineMs,
    signal: opts?.signal,
    model: item.model,
  })
}

// ============ AI 应用 (rh-app) 的提交/轮询/恢复 helper, 与标准模型完全对称 ============

export interface AiAppPollOpts {
  pollIntervalMs?: number
  deadlineMs?: number
  signal?: AigcAbortLike
}

function aiAppFailure(code: string, message: string, jobId: string, retryable = false): AiAppRunResponse {
  return {
    ok: false,
    version: "rh-ai-app.v1",
    state: "failed",
    job: { jobId, taskId: "", state: "failed" },
    outputs: [],
    results: [],
    error: { code, message, retryable, taskId: "" },
  }
}

// 共享 poll 循环。终态一律以 AiAppRunResponse 返回, **不 throw**:
// TIMEOUT / NETWORK / ABORTED / RH_LOGIN_REQUIRED 见 error.code。
async function pollAiAppToResult(slug: string, jobId: string, opts?: AiAppPollOpts): Promise<AiAppRunResponse> {
  const interval = opts?.pollIntervalMs ?? 3000
  const deadline = Date.now() + (opts?.deadlineMs ?? 60 * 60_000)
  let consecutiveFails = 0
  while (true) {
    if (opts?.signal?.aborted) return aiAppFailure("ABORTED", "已取消", jobId)
    if (Date.now() > deadline) return aiAppFailure("TIMEOUT", "生成超时, 请重试", jobId, true)
    await sleep(interval)
    try {
      const pollRes = await callAiApp<AiAppRunResponse>(
        `/api/aigc/ai-app/${slug}/jobs/${encodeURIComponent(jobId)}/poll`,
        {},
      )
      consecutiveFails = 0
      if (pollRes.state === "succeeded" || pollRes.state === "failed" || pollRes.state === "partial") {
        return pollRes
      }
      // queued / running → 继续 loop
    } catch (e) {
      const status = e instanceof MiniRequestError ? e.statusCode : 0
      const errData = e instanceof MiniRequestError ? e.data : undefined
      const msg = String((e as Error)?.message || e)
      if (isLoginRequiredSignal(status, msg, errData)) {
        return aiAppFailure("RH_LOGIN_REQUIRED", LOGIN_REQUIRED_ZH, jobId)
      }
      consecutiveFails++
      if (consecutiveFails >= 5) {
        return aiAppFailure("NETWORK", "网络连接不稳定, 请检查网络后重试", jobId, true)
      }
    }
  }
}

// 提交 AI 应用 run + 自动 poll 到终态。失败/超时/412/401 全部返回结构化 AiAppRunResponse, **不 throw**。
export async function callAiAppAndPoll(slug: string, body: unknown, opts?: AiAppPollOpts): Promise<AiAppRunResponse> {
  let submitRes: AiAppRunResponse
  try {
    submitRes = await callAiApp<AiAppRunResponse>(`/api/aigc/ai-app/${slug}/run`, body)
  } catch (e) {
    const status = e instanceof MiniRequestError ? e.statusCode : 0
    const errData = e instanceof MiniRequestError ? e.data : undefined
    const msg = String((e as Error)?.message || e)
    if (isLoginRequiredSignal(status, msg, errData)) {
      return aiAppFailure("RH_LOGIN_REQUIRED", LOGIN_REQUIRED_ZH, "")
    }
    return aiAppFailure("SUBMIT_FAILED", msg || "提交失败, 请重试", "", true)
  }
  if (
    submitRes.error?.code?.startsWith("APIKEY") ||
    isLoginRequiredSignal(0, submitRes.error?.code, submitRes.error?.message)
  ) {
    return aiAppFailure("RH_LOGIN_REQUIRED", LOGIN_REQUIRED_ZH, "")
  }
  const jobId = submitRes.job?.jobId
  if (!jobId) {
    if (submitRes.state === "succeeded" || submitRes.state === "failed") return submitRes
    return aiAppFailure(submitRes.error?.code || "SUBMIT_FAILED", submitRes.error?.message || "提交失败, 请重试", "", true)
  }
  return pollAiAppToResult(slug, jobId, opts)
}

// 恢复一个还在 running 的 AI 应用任务的 poll (页面挂载时对 history 里 running 项调用)。
export async function resumeAiAppJob(
  slug: string,
  item: { jobId: string },
  opts?: AiAppPollOpts,
): Promise<AiAppRunResponse> {
  return pollAiAppToResult(slug, item.jobId, opts)
}

const AI_APP_ERROR_MESSAGES_ZH: Record<string, string> = {
  RH_LOGIN_REQUIRED: LOGIN_REQUIRED_ZH,
  TIMEOUT: "AI 生成超时 (可能服务器繁忙), 请稍后重试",
  NETWORK: "网络连接不稳定, 请检查网络后重试",
  ABORTED: "已取消",
  SUBMIT_FAILED: "提交生成任务失败 (网络或服务器繁忙), 请稍后重试",
}

// AiAppRunResponse 失败分支 → 中文详情, 镜像 formatAigcFailureMessage: 始终追加 RH 真实原因。
// RH_LOGIN_REQUIRED / SANDBOX_TOKEN_* 只展示登录引导, 不拼技术码。
export function formatAiAppFailureMessage(res: AiAppRunResponse): string {
  const code = String(res.error?.code || "")
  const raw = String(res.error?.message || "")
  const hay = `${code} ${raw}`.toLowerCase()
  let base = AI_APP_ERROR_MESSAGES_ZH[code] || ""
  if (!base) {
    if (code.startsWith("APIKEY") || isLoginRequiredSignal(0, code, raw)) base = AI_APP_ERROR_MESSAGES_ZH.RH_LOGIN_REQUIRED
    else if (hay.includes("insufficient") || hay.includes("balance") || hay.includes("余额") || hay.includes("点数") || hay.includes("积分")) base = "RunningHub 账户余额不足, 请充值后重试"
    else if (/content security audit|内容安全审查|内容审查|审核未通过|content moderation/i.test(raw)) base = "内容审核未通过"
    else base = "生成失败, 请稍后重试或换个 prompt"
  }
  if (base === AI_APP_ERROR_MESSAGES_ZH.RH_LOGIN_REQUIRED) return base
  if (raw && raw !== base) return `${base}: ${raw}`
  return base
}
