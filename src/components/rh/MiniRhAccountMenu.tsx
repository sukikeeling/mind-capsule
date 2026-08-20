// 小程序页面右上角 / 导航栏的 RunningHub 账号入口唯一标准模板。
// 与 Web RhAccountMenu 的能力对齐，但只使用 Taro 组件和 miniAuth：
// 未登录时打开手机号密码登录面板；已登录时展示双余额、刷新和退出登录。
// 不要把浏览器 SSO、共享 Cookie 或 RH 主站页面入口复制到小程序。
import {
  MiniRhLoginCard,
  type MiniRhLoginCardProps,
} from "./MiniRhLoginCard"

export type MiniRhAccountMenuProps = Pick<
  MiniRhLoginCardProps,
  "className" | "onAuthChange"
>

export function MiniRhAccountMenu({
  className,
  onAuthChange,
}: MiniRhAccountMenuProps) {
  return (
    <MiniRhLoginCard
      compact
      title="RunningHub"
      subtitle="登录后可查看账号余额，并使用当前 RunningHub 身份继续操作。"
      className={className}
      onAuthChange={onAuthChange}
    />
  )
}
