import { Button, Switch, Text, View } from "@tarojs/components"
import type { UseCostConfirmResult } from "@/hooks/useCostConfirm"
import "./CostConfirmDialog.css"

type CostConfirmDialogProps = Pick<
  UseCostConfirmResult,
  "costConfirmOpen" | "costConfirmPriceText" | "dontShowToday" | "setDontShowToday" | "confirmCostAction" | "cancelCostConfirm"
> & {
  title?: string
}

export function CostConfirmDialog({
  costConfirmOpen,
  costConfirmPriceText,
  dontShowToday,
  setDontShowToday,
  confirmCostAction,
  cancelCostConfirm,
  title = "确认运行",
}: CostConfirmDialogProps) {
  if (!costConfirmOpen) return null

  return (
    <View className="mini-cost-confirm" onClick={cancelCostConfirm}>
      <View className="mini-cost-confirm__panel" onClick={(event) => event.stopPropagation()}>
        <View className="mini-cost-confirm__icon">
          <Text>¥</Text>
        </View>
        <Text className="mini-cost-confirm__title">{title}</Text>
        <Text className="mini-cost-confirm__body">
          将调用 RunningHub AI，可能消耗 RH 币或钱包余额。{costConfirmPriceText ? ` ${costConfirmPriceText}。` : ""}
        </Text>
        <View className="mini-cost-confirm__option">
          <Switch checked={dontShowToday} color="#111827" onChange={(event) => setDontShowToday(event.detail.value)} />
          <Text>今天内不再提醒（仅对当前项目有效）</Text>
        </View>
        <View className="mini-cost-confirm__actions">
          <Button className="mini-cost-confirm__cancel" onClick={cancelCostConfirm}>
            <Text className="mini-cost-confirm__button-label mini-cost-confirm__button-label--cancel">取消</Text>
          </Button>
          <Button className="mini-cost-confirm__confirm" onClick={confirmCostAction}>
            <Text className="mini-cost-confirm__button-label mini-cost-confirm__button-label--confirm">确认运行</Text>
          </Button>
        </View>
      </View>
    </View>
  )
}
