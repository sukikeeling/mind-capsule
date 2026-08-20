import { useCallback, useEffect, useState } from "react"
import Taro from "@tarojs/taro"
import { Button, Image, Input, Text, View } from "@tarojs/components"
import {
  fetchRunningHubAccountInfo,
  getMiniAuthState,
  loginWithRunningHub,
  logoutRunningHub,
  type MiniAuthState,
  type MiniRhAccountInfo,
} from "@/lib/miniAuth"
import "./MiniRhLoginCard.css"

export type MiniRhLoginCardProps = {
  title?: string
  subtitle?: string
  submitText?: string
  compact?: boolean
  className?: string
  onAuthChange?: (state: MiniAuthState, account: MiniRhAccountInfo | null) => void
}

const H5_NATIVE_INPUT_PROPS = {
  style: {
    boxSizing: "border-box",
    display: "block",
    width: "100%",
    height: "100%",
    margin: "0",
    padding: "0",
    border: "0",
    background: "transparent",
    color: "inherit",
    font: "inherit",
    lineHeight: "normal",
  },
}

function errorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message
  return "RunningHub 账号操作失败，请稍后重试"
}

function fallbackName(state: MiniAuthState): string {
  if (!state.loggedIn) return "RunningHub"
  return state.displayName || state.mobile || (state.userId ? `User ${state.userId}` : "RunningHub")
}

function compactTitle(title: string): string {
  return title === "RunningHub" ? "RunningHub 登录" : title
}

export function MiniRhLoginCard({
  title = "RunningHub 登录",
  subtitle = "登录后可使用 RunningHub 能力，并按当前账号保存记录。",
  submitText = "登录 RunningHub",
  compact = false,
  className = "",
  onAuthChange,
}: MiniRhLoginCardProps) {
  const [ready, setReady] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [mobile, setMobile] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [authState, setAuthState] = useState<MiniAuthState>(() => getMiniAuthState())
  const [account, setAccount] = useState<MiniRhAccountInfo | null>(null)

  const refreshAccount = useCallback(async () => {
    const state = getMiniAuthState()
    setAuthState(state)
    if (!state.loggedIn) {
      setAccount(null)
      onAuthChange?.(state, null)
      return null
    }

    const info = await fetchRunningHubAccountInfo().catch(() => null)
    setAccount(info)
    onAuthChange?.(getMiniAuthState(), info)
    return info
  }, [onAuthChange])

  useEffect(() => {
    let mounted = true
    refreshAccount().finally(() => {
      if (mounted) setReady(true)
    })
    return () => {
      mounted = false
    }
  }, [refreshAccount])

  const handleLogin = useCallback(async () => {
    setError("")
    setSubmitting(true)
    try {
      await loginWithRunningHub({ mobile, password })
      setPassword("")
      await refreshAccount()
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }, [mobile, password, refreshAccount])

  const handleLogout = useCallback(async () => {
    const result = await Taro.showModal({
      title: "退出登录",
      content: "确定要退出当前 RunningHub 账号吗？",
      confirmText: "退出",
      confirmColor: "#dc2626",
    }).catch(() => null)
    if (!result?.confirm) return
    setRefreshing(true)
    setError("")
    try {
      await logoutRunningHub()
      await refreshAccount()
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setRefreshing(false)
    }
  }, [refreshAccount])

  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    setError("")
    try {
      await refreshAccount()
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setRefreshing(false)
    }
  }, [refreshAccount])

  const handleDialogAuthChange = useCallback(
    (state: MiniAuthState, info: MiniRhAccountInfo | null) => {
      const wasLoggedIn = authState.loggedIn
      setAuthState(state)
      setAccount(info)
      onAuthChange?.(state, info)
      if (wasLoggedIn !== state.loggedIn) setDialogOpen(false)
    },
    [authState.loggedIn, onAuthChange],
  )

  const loggedIn = authState.loggedIn
  const displayName = account?.displayName || fallbackName(authState)
  const avatar = account?.avatar
  const walletBalance = account?.walletBalance

  if (!ready) {
    if (compact) {
      return <View className={`mini-rh-login-entry mini-rh-login-entry--loading ${className}`} />
    }
    return <View className={`mini-rh-login-card mini-rh-login-card--skeleton ${className}`} />
  }

  if (compact) {
    return (
      <View className={`mini-rh-login-entry-wrap ${className}`}>
        <Button
          className={`mini-rh-login-entry ${loggedIn ? "is-online" : ""}`}
          hoverClass="mini-rh-login-entry--pressed"
          onClick={() => setDialogOpen(true)}
        >
          {loggedIn ? (
            avatar ? (
              <Image className="mini-rh-login-entry__avatar" src={avatar} mode="aspectFill" />
            ) : (
              <View className="mini-rh-login-entry__avatar mini-rh-login-entry__avatar--text">
                <Text>{displayName.slice(0, 1)}</Text>
              </View>
            )
          ) : (
            <View className="mini-rh-login-entry__dot" />
          )}
          <Text className="mini-rh-login-entry__text">{loggedIn ? displayName : "登录"}</Text>
          {loggedIn && <Text className="mini-rh-login-entry__caret">⌄</Text>}
        </Button>

        {dialogOpen && (
          <View className="mini-rh-login-dialog">
            <View className="mini-rh-login-dialog__backdrop" onClick={() => setDialogOpen(false)} />
            <View className="mini-rh-login-dialog__panel">
              <Button className="mini-rh-login-dialog__close" hoverClass="mini-rh-login-dialog__close--pressed" onClick={() => setDialogOpen(false)}>
                <Text className="mini-rh-login-dialog__close-label">×</Text>
              </Button>
              <MiniRhLoginCard
                title={loggedIn ? "个人中心" : compactTitle(title)}
                subtitle={loggedIn
                  ? "查看 RunningHub 余额、刷新账号或安全退出登录。"
                  : subtitle || "登录后可使用 RunningHub 能力，并按当前账号保存记录。"}
                submitText={submitText === "登录" ? "登录 RunningHub" : submitText}
                onAuthChange={handleDialogAuthChange}
              />
            </View>
          </View>
        )}
      </View>
    )
  }

  return (
    <View className={`mini-rh-login-card ${className}`}>
      <View className="mini-rh-login-card__header">
        <View>
          <Text className="mini-rh-login-card__title">{title}</Text>
          <Text className="mini-rh-login-card__subtitle">{subtitle}</Text>
        </View>
        <View className={`mini-rh-login-card__status ${loggedIn ? "is-online" : ""}`}>
          <View className="mini-rh-login-card__dot" />
          <Text>{loggedIn ? "已登录" : "未登录"}</Text>
        </View>
      </View>

      {loggedIn ? (
        <View className="mini-rh-login-card__account">
          <View className="mini-rh-login-card__profile">
            {avatar ? (
              <Image className="mini-rh-login-card__avatar" src={avatar} mode="aspectFill" />
            ) : (
              <View className="mini-rh-login-card__avatar mini-rh-login-card__avatar--text">
                <Text>{displayName.slice(0, 1)}</Text>
              </View>
            )}
            <View className="mini-rh-login-card__profile-main">
              <Text className="mini-rh-login-card__name">{displayName}</Text>
              <Text className="mini-rh-login-card__meta">{account?.mobile || authState.mobile || authState.userId || "RunningHub 账号"}</Text>
            </View>
          </View>

          <View className="mini-rh-login-card__balance-grid">
            <View className="mini-rh-login-card__balance">
              <Text className="mini-rh-login-card__balance-label">RH币余额</Text>
              <Text className="mini-rh-login-card__balance-value">{account?.totalCoin ?? "--"}</Text>
            </View>
            <View className="mini-rh-login-card__balance">
              <Text className="mini-rh-login-card__balance-label">钱包余额</Text>
              <Text className="mini-rh-login-card__balance-value">{walletBalance ?? "--"}</Text>
            </View>
          </View>

          {error && <Text className="mini-rh-login-card__error">{error}</Text>}

          <View className="mini-rh-login-card__actions">
            <Button className="mini-rh-login-card__secondary" loading={refreshing} disabled={refreshing} onClick={handleRefresh}>
              <Text className="mini-rh-login-card__button-label mini-rh-login-card__button-label--secondary">刷新账号</Text>
            </Button>
            <Button className="mini-rh-login-card__danger" loading={refreshing} disabled={refreshing} onClick={handleLogout}>
              <Text className="mini-rh-login-card__button-label mini-rh-login-card__button-label--danger">退出登录</Text>
            </Button>
          </View>
        </View>
      ) : (
        <View className="mini-rh-login-card__form">
          <View className="mini-rh-login-card__field">
            <Input
              className="mini-rh-login-card__input"
              type="number"
              maxlength={11}
              value={mobile}
              placeholder="请输入手机号"
              placeholderClass="mini-rh-login-card__placeholder"
              nativeProps={process.env.TARO_ENV === "h5" ? H5_NATIVE_INPUT_PROPS : undefined}
              onInput={(event) => setMobile(String(event.detail.value ?? ""))}
            />
          </View>
          <View className="mini-rh-login-card__field">
            <Input
              className="mini-rh-login-card__input"
              password
              value={password}
              placeholder="请输入 RunningHub 密码"
              placeholderClass="mini-rh-login-card__placeholder"
              nativeProps={process.env.TARO_ENV === "h5" ? H5_NATIVE_INPUT_PROPS : undefined}
              onInput={(event) => setPassword(String(event.detail.value ?? ""))}
            />
          </View>
          {error && <Text className="mini-rh-login-card__error">{error}</Text>}
          <Button className="mini-rh-login-card__primary" loading={submitting} disabled={submitting} onClick={handleLogin}>
            <Text className="mini-rh-login-card__button-label mini-rh-login-card__button-label--primary">{submitText}</Text>
          </Button>
        </View>
      )}
    </View>
  )
}
