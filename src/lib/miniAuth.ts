import Taro from "@tarojs/taro"
import { getRuntimePlatform, getVibeXApiBase, isH5Runtime } from "./platform"

const RH_API_BASE = "https://www.runninghub.cn"
const ACCESS_TOKEN_KEY = "Rh-Accesstoken"
const REFRESH_TOKEN_KEY = "Rh-Refreshtoken"
const IDENTIFY_KEY = "Rh-Identify"
const USER_INFO_KEY = "Rh-UserInfo"

function getRhApiUrl(path: string): string {
  if (isH5Runtime()) {
    const base = getVibeXApiBase()
    return base ? `${base}${path}` : path
  }
  return `${RH_API_BASE}${path}`
}

export type RhJwtPayload = {
  sub?: string
  user_name?: string
  username?: string
  nickName?: string
  mobile?: string
  exp?: number
}

export type MiniRhAccountInfo = {
  userId: string
  displayName: string
  avatar?: string
  mobile?: string
  totalCoin?: string
  walletBalance?: string
  walletRawBalance?: string
  walletCurrency?: string
}

export type MiniAuthLoggedInState = {
  loggedIn: true
  accessToken: string
  refreshToken?: string
  identify?: string
  userId?: string
  displayName?: string
  mobile?: string
  platform: ReturnType<typeof getRuntimePlatform>
}

export type MiniAuthLoggedOutState = {
  loggedIn: false
  accessToken: ""
  platform: ReturnType<typeof getRuntimePlatform>
  reason: "not_logged_in" | "token_expired"
}

export type MiniAuthState = MiniAuthLoggedInState | MiniAuthLoggedOutState

export type RunningHubPasswordLoginInput = {
  mobile: string
  password: string
}

export class MiniAuthError extends Error {
  code?: string | number
  statusCode?: number
  data?: unknown

  constructor(message: string, options: { code?: string | number; statusCode?: number; data?: unknown } = {}) {
    super(message)
    this.name = "MiniAuthError"
    this.code = options.code
    this.statusCode = options.statusCode
    this.data = options.data
  }
}

export class MiniAuthRequiredError extends MiniAuthError {
  constructor(reason = "请先登录 RunningHub") {
    super(reason, { code: "rh_login_required" })
    this.name = "MiniAuthRequiredError"
  }
}

function readStorageString(key: string): string {
  try {
    const value = Taro.getStorageSync<string>(key)
    return typeof value === "string" ? value : ""
  } catch {
    return ""
  }
}

function writeStorageString(key: string, value?: string): void {
  try {
    if (value) Taro.setStorageSync(key, value)
    else Taro.removeStorageSync(key)
  } catch {
    // ignore storage failures; callers still receive the login result.
  }
}

function readStoredAccountInfo(): Partial<MiniRhAccountInfo> {
  try {
    const value = Taro.getStorageSync<Partial<MiniRhAccountInfo>>(USER_INFO_KEY)
    return value && typeof value === "object" ? value : {}
  } catch {
    return {}
  }
}

function writeStoredAccountInfo(value: Partial<MiniRhAccountInfo>): void {
  try {
    Taro.setStorageSync(USER_INFO_KEY, value)
  } catch {
    // ignore
  }
}

function normalizeToken(value: string): string {
  return value.replace(/^Bearer\s+/i, "").trim()
}

const MD5_SHIFT = [
  7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22,
  5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20,
  4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23,
  6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21,
]
const MD5_TABLE = Array.from({ length: 64 }, (_, index) => Math.floor(Math.abs(Math.sin(index + 1)) * 0x100000000) >>> 0)

function utf8Bytes(input: string): number[] {
  const bytes: number[] = []
  for (const char of input) {
    const codePoint = char.codePointAt(0) ?? 0
    if (codePoint <= 0x7f) {
      bytes.push(codePoint)
    } else if (codePoint <= 0x7ff) {
      bytes.push(0xc0 | (codePoint >> 6), 0x80 | (codePoint & 0x3f))
    } else if (codePoint <= 0xffff) {
      bytes.push(0xe0 | (codePoint >> 12), 0x80 | ((codePoint >> 6) & 0x3f), 0x80 | (codePoint & 0x3f))
    } else {
      bytes.push(
        0xf0 | (codePoint >> 18),
        0x80 | ((codePoint >> 12) & 0x3f),
        0x80 | ((codePoint >> 6) & 0x3f),
        0x80 | (codePoint & 0x3f),
      )
    }
  }
  return bytes
}

function add32(...values: number[]): number {
  return values.reduce((sum, value) => (sum + value) >>> 0, 0)
}

function rotateLeft32(value: number, shift: number): number {
  return ((value << shift) | (value >>> (32 - shift))) >>> 0
}

function wordToHex(value: number): string {
  let output = ""
  for (let index = 0; index < 4; index += 1) {
    output += ((value >>> (index * 8)) & 0xff).toString(16).padStart(2, "0")
  }
  return output
}

function md5(input: string): string {
  const bytes = utf8Bytes(input)
  const bitLength = bytes.length * 8
  bytes.push(0x80)
  while (bytes.length % 64 !== 56) bytes.push(0)
  for (let index = 0; index < 8; index += 1) {
    bytes.push(Math.floor(bitLength / 2 ** (8 * index)) & 0xff)
  }

  let a0 = 0x67452301
  let b0 = 0xefcdab89
  let c0 = 0x98badcfe
  let d0 = 0x10325476

  for (let offset = 0; offset < bytes.length; offset += 64) {
    const words: number[] = []
    for (let index = 0; index < 16; index += 1) {
      const base = offset + index * 4
      words[index] = (bytes[base] | (bytes[base + 1] << 8) | (bytes[base + 2] << 16) | (bytes[base + 3] << 24)) >>> 0
    }

    let a = a0
    let b = b0
    let c = c0
    let d = d0

    for (let index = 0; index < 64; index += 1) {
      let f: number
      let g: number
      if (index < 16) {
        f = (b & c) | (~b & d)
        g = index
      } else if (index < 32) {
        f = (d & b) | (~d & c)
        g = (5 * index + 1) % 16
      } else if (index < 48) {
        f = b ^ c ^ d
        g = (3 * index + 5) % 16
      } else {
        f = c ^ (b | ~d)
        g = (7 * index) % 16
      }
      const previousD = d
      d = c
      c = b
      b = add32(b, rotateLeft32(add32(a, f, MD5_TABLE[index], words[g]), MD5_SHIFT[index]))
      a = previousD
    }

    a0 = add32(a0, a)
    b0 = add32(b0, b)
    c0 = add32(c0, c)
    d0 = add32(d0, d)
  }

  return `${wordToHex(a0)}${wordToHex(b0)}${wordToHex(c0)}${wordToHex(d0)}`
}

function readPath(source: unknown, path: string[]): unknown {
  let current = source as Record<string, unknown> | undefined
  for (const key of path) {
    if (!current || typeof current !== "object") return undefined
    current = current[key] as Record<string, unknown> | undefined
  }
  return current
}

function firstString(source: unknown, paths: string[][]): string {
  for (const path of paths) {
    const value = readPath(source, path)
    if (typeof value === "string" && value.trim()) return value.trim()
    if (typeof value === "number") return String(value)
  }
  return ""
}

function firstNumber(source: unknown, paths: string[][]): number | undefined {
  for (const path of paths) {
    const value = readPath(source, path)
    if (typeof value === "number" && Number.isFinite(value)) return value
    if (typeof value === "string" && value.trim() && Number.isFinite(Number(value))) return Number(value)
  }
  return undefined
}

function isSuccessCode(code: unknown): boolean {
  return code === undefined || code === null || code === 0 || code === "0" || code === 200 || code === "200"
}

function headerValue(headers: unknown, name: string): string {
  if (!headers || typeof headers !== "object") return ""
  const lowerName = name.toLowerCase()
  for (const [key, value] of Object.entries(headers as Record<string, unknown>)) {
    if (key.toLowerCase() !== lowerName) continue
    if (typeof value === "string") return value
    if (Array.isArray(value)) return value.filter((item) => typeof item === "string").join(",")
  }
  return ""
}

function cookieValue(rawCookie: string, name: string): string {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  const match = rawCookie.match(new RegExp(`(?:^|[,;]\\s*)${escaped}=([^;,]+)`))
  return match ? decodeURIComponent(match[1]) : ""
}


function transportCookieValue(headers: unknown, cookies: unknown, name: string): string {
  const items: string[] = []
  const setCookie = headerValue(headers, "set-cookie") || headerValue(headers, "Set-Cookie")
  if (setCookie) items.push(setCookie)
  if (Array.isArray(cookies)) items.push(...cookies.filter((item): item is string => typeof item === "string"))
  if (typeof cookies === "string") items.push(cookies)
  for (const item of items) {
    const value = cookieValue(item, name)
    if (value) return value
  }
  return ""
}

function decodeUtf8Binary(binary: string): string {
  try {
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0))
    if (typeof TextDecoder !== "undefined") return new TextDecoder().decode(bytes)
    return decodeURIComponent(Array.from(bytes, (byte) => `%${byte.toString(16).padStart(2, "0")}`).join(""))
  } catch {
    return binary
  }
}

function decodeBase64Url(value: string): string {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(value.length + ((4 - (value.length % 4)) % 4), "=")
  if (typeof atob === "function") return decodeUtf8Binary(atob(padded))

  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"
  let buffer = 0
  let bits = 0
  let binary = ""
  for (const char of padded.replace(/=+$/, "")) {
    const index = chars.indexOf(char)
    if (index < 0) continue
    buffer = (buffer << 6) | index
    bits += 6
    if (bits >= 8) {
      bits -= 8
      binary += String.fromCharCode((buffer >> bits) & 0xff)
    }
  }
  return decodeUtf8Binary(binary)
}

export function decodeRhToken(token = getAccessToken()): RhJwtPayload | null {
  const raw = normalizeToken(token)
  if (!raw) return null
  const parts = raw.split(".")
  if (parts.length < 2) return null
  try {
    return JSON.parse(decodeBase64Url(parts[1])) as RhJwtPayload
  } catch {
    return null
  }
}

export function isAccessTokenExpired(token = getAccessToken()): boolean {
  const payload = decodeRhToken(token)
  if (!payload?.exp) return false
  return payload.exp * 1000 <= Date.now() + 30000
}

export function getAccessToken(): string {
  return normalizeToken(readStorageString(ACCESS_TOKEN_KEY))
}

export function getRhAccessToken(): string {
  return getAccessToken()
}

export function getRefreshToken(): string {
  return readStorageString(REFRESH_TOKEN_KEY)
}

export function getRunningHubAuthHeaders(): Record<string, string> {
  const token = getAccessToken()
  if (!token || isAccessTokenExpired(token)) return {}
  return {
    Authorization: `Bearer ${token}`,
    "RH-TOKEN": token,
    "Rh-Accesstoken": token,
  }
}

export function getMiniAuthState(): MiniAuthState {
  const platform = getRuntimePlatform()
  const accessToken = getAccessToken()
  if (!accessToken) return { loggedIn: false, accessToken: "", platform, reason: "not_logged_in" }
  if (isAccessTokenExpired(accessToken)) return { loggedIn: false, accessToken: "", platform, reason: "token_expired" }

  const payload = decodeRhToken(accessToken)
  const storedUser = readStoredAccountInfo()
  const refreshToken = getRefreshToken()
  const identify = readStorageString(IDENTIFY_KEY)
  return {
    loggedIn: true,
    accessToken,
    refreshToken: refreshToken || undefined,
    identify: identify || undefined,
    userId: storedUser.userId || payload?.sub,
    displayName: storedUser.displayName || payload?.nickName || payload?.user_name || payload?.username || payload?.mobile,
    mobile: storedUser.mobile || payload?.mobile,
    platform,
  }
}

function saveLoginBody(body: unknown, transport: { headers?: unknown; cookies?: unknown } = {}): MiniAuthLoggedInState {
  const accessToken = normalizeToken(
    firstString(body, [
      ["data", "accessToken"],
      ["data", "access_token"],
      ["data", "token"],
      ["data", "jwt"],
      ["accessToken"],
      ["access_token"],
      ["token"],
      ["transport", "accessToken"],
    ]) || transportCookieValue(transport.headers, transport.cookies, ACCESS_TOKEN_KEY),
  )
  if (!accessToken) {
    throw new MiniAuthError("RunningHub 登录成功响应中缺少 accessToken", { code: "missing_access_token", data: body })
  }

  const refreshToken = normalizeToken(
    firstString(body, [
      ["data", "refreshToken"],
      ["data", "refresh_token"],
      ["data", "Rh-Refreshtoken"],
      ["refreshToken"],
      ["refresh_token"],
      ["transport", "refreshToken"],
    ]) || transportCookieValue(transport.headers, transport.cookies, REFRESH_TOKEN_KEY),
  )
  const identify = firstString(body, [["data", "identify"], ["data", "Rh-Identify"], ["identify"], ["transport", "identify"]]) || transportCookieValue(transport.headers, transport.cookies, IDENTIFY_KEY)
  const payload = decodeRhToken(accessToken)
  const userId =
    firstString(body, [["data", "userId"], ["data", "id"], ["data", "user", "id"], ["userId"], ["id"]]) || payload?.sub || ""
  const displayName =
    firstString(body, [
      ["data", "nickName"],
      ["data", "nickname"],
      ["data", "username"],
      ["data", "userName"],
      ["data", "user", "nickName"],
      ["data", "user", "username"],
    ]) || payload?.nickName || payload?.user_name || payload?.username || payload?.mobile || ""
  const mobile = firstString(body, [["data", "mobile"], ["data", "user", "mobile"], ["mobile"]]) || payload?.mobile || ""

  writeStorageString(ACCESS_TOKEN_KEY, accessToken)
  writeStorageString(REFRESH_TOKEN_KEY, refreshToken)
  writeStorageString(IDENTIFY_KEY, identify)
  writeStoredAccountInfo({ userId, displayName, mobile })

  const state = getMiniAuthState()
  if (!state.loggedIn) throw new MiniAuthError("RunningHub 登录态保存失败", { code: state.reason, data: body })
  return state
}

function responseMessage(body: unknown, fallback: string): string {
  return firstString(body, [["msg"], ["message"], ["error"], ["errorMessages", "0"], ["data", "message"]]) || fallback
}

function requestFailureMessage(error: unknown): string {
  const raw = error && typeof error === "object"
    ? String((error as { errMsg?: unknown; message?: unknown }).errMsg || (error as { message?: unknown }).message || "")
    : String(error || "")
  if (/url not in domain list|domain list|合法域名|invalid url/i.test(raw)) {
    return "登录请求被微信拦截，请在小程序后台配置 request 合法域名：https://www.runninghub.cn"
  }
  if (/timeout/i.test(raw)) return "RunningHub 登录请求超时，请稍后重试"
  return raw ? `登录请求失败：${raw}` : "登录请求失败，请检查网络后重试"
}

export async function loginWithRunningHub(input: RunningHubPasswordLoginInput): Promise<MiniAuthLoggedInState> {
  const mobile = input.mobile.trim()
  const password = input.password
  if (!/^1\d{10}$/.test(mobile)) throw new MiniAuthError("请输入 11 位手机号", { code: "invalid_mobile" })
  if (!password) throw new MiniAuthError("请输入 RunningHub 密码", { code: "missing_password" })

  let response: Taro.request.SuccessCallbackResult<Record<string, unknown> | string | ArrayBuffer>
  try {
    response = await Taro.request({
      url: getRhApiUrl("/uc/pwdLogin"),
      method: "POST" as any,
      data: { mobile, password: md5(password) },
      header: { "content-type": "application/json" },
      timeout: 30000,
    })
  } catch (err) {
    throw new MiniAuthError(requestFailureMessage(err), { code: "request_failed", data: err })
  }
  const body = response.data as unknown
  const code = firstNumber(body, [["code"]]) ?? firstString(body, [["code"]])
  if ((response.statusCode ?? 0) < 200 || (response.statusCode ?? 0) >= 300 || !isSuccessCode(code)) {
    throw new MiniAuthError(responseMessage(body, "RunningHub 登录失败"), {
      code,
      statusCode: response.statusCode,
      data: body,
    })
  }
  const responseMeta = response as typeof response & { cookies?: string[]; header?: Record<string, unknown> }
  const payload = body && typeof body === "object" && !Array.isArray(body)
    ? { ...(body as Record<string, unknown>), transport: {} }
    : { data: body, transport: {} }
  return saveLoginBody(payload, { headers: responseMeta.header, cookies: responseMeta.cookies })
}

export async function requireRunningHubLogin(): Promise<MiniAuthLoggedInState> {
  const state = getMiniAuthState()
  if (!state.loggedIn) throw new MiniAuthRequiredError(state.reason === "token_expired" ? "RunningHub 登录态已过期" : undefined)
  return state
}

export async function fetchRunningHubAccountInfo(): Promise<MiniRhAccountInfo | null> {
  const state = getMiniAuthState()
  if (!state.loggedIn || !state.userId) return null

  const response = await Taro.request({
    url: getRhApiUrl("/uc/getUserInfo"),
    method: "POST" as any,
    data: { userId: state.userId },
    header: {
      "content-type": "application/json",
      ...getRunningHubAuthHeaders(),
    },
    timeout: 30000,
  })
  const body = response.data as unknown
  const code = firstNumber(body, [["code"]]) ?? firstString(body, [["code"]])
  if ((response.statusCode ?? 0) < 200 || (response.statusCode ?? 0) >= 300 || !isSuccessCode(code)) return null

  const data = readPath(body, ["data"]) ?? body
  const walletRawBalance = firstString(data, [["walletInfo", "balance"]])
  const walletCurrencyCode = firstString(data, [["walletInfo", "currency"]]).toUpperCase()
  const walletCurrency =
    firstString(data, [["walletInfo", "currencySymbol"]]) ||
    (walletCurrencyCode === "USD" ? "$" : "¥")
  const account: MiniRhAccountInfo = {
    userId: firstString(data, [["id"], ["userId"]]) || state.userId,
    displayName:
      firstString(data, [["nickName"], ["nickname"], ["mobile"], ["email"], ["username"], ["userName"]]) ||
      state.displayName ||
      `User ${state.userId}`,
    avatar: firstString(data, [["headIcon"], ["avatar"], ["avatarUrl"]]) || undefined,
    mobile: firstString(data, [["mobile"]]) || state.mobile,
    totalCoin: firstString(data, [["totalCoin"]]) || undefined,
    walletBalance: walletRawBalance ? `${walletCurrency}${walletRawBalance}` : undefined,
    walletRawBalance: walletRawBalance || undefined,
    walletCurrency: walletRawBalance ? walletCurrency : undefined,
  }
  writeStoredAccountInfo(account)
  return account
}

export async function logoutRunningHub(): Promise<void> {
  const token = getAccessToken()
  if (token) {
    await Taro.request({
      url: getRhApiUrl("/uc/logout"),
      method: "POST" as any,
      data: {},
      header: {
        "content-type": "application/json",
        ...getRunningHubAuthHeaders(),
      },
      timeout: 15000,
    }).catch(() => undefined)
  }

  writeStorageString(ACCESS_TOKEN_KEY, "")
  writeStorageString(REFRESH_TOKEN_KEY, "")
  writeStorageString(IDENTIFY_KEY, "")
  try {
    Taro.removeStorageSync(USER_INFO_KEY)
  } catch {
    // ignore
  }
}

export async function getPlatformLoginCode(): Promise<string> {
  const result = await Taro.login()
  return result.code || ""
}
