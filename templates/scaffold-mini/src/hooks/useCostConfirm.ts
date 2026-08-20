import { useCallback, useMemo, useRef, useState } from "react"
import { currentVibexAppId, hasCostConfirmedToday, rememberCostConfirmedToday } from "@/lib/costConfirm"

type CostAction = () => void | Promise<void>

export function useCostConfirm() {
  const appId = useMemo(() => currentVibexAppId(), [])
  const [costConfirmOpen, setCostConfirmOpen] = useState(false)
  const [costConfirmPriceText, setCostConfirmPriceText] = useState("")
  const [dontShowToday, setDontShowToday] = useState(false)
  const pendingActionRef = useRef<CostAction | null>(null)

  const runWithCostConfirm = useCallback(
    (action: CostAction, priceText: string) => {
      if (hasCostConfirmedToday(appId)) {
        void action()
        return
      }
      pendingActionRef.current = action
      setCostConfirmPriceText(priceText)
      setCostConfirmOpen(true)
    },
    [appId],
  )

  const confirmCostAction = useCallback(() => {
    setCostConfirmOpen(false)
    if (dontShowToday) rememberCostConfirmedToday(appId)
    const action = pendingActionRef.current
    pendingActionRef.current = null
    void action?.()
  }, [appId, dontShowToday])

  const cancelCostConfirm = useCallback(() => {
    setCostConfirmOpen(false)
    pendingActionRef.current = null
  }, [])

  return {
    runWithCostConfirm,
    costConfirmOpen,
    costConfirmPriceText,
    dontShowToday,
    setDontShowToday,
    confirmCostAction,
    cancelCostConfirm,
  }
}

export type UseCostConfirmResult = ReturnType<typeof useCostConfirm>
