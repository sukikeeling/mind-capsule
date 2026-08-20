import { useCallback, useEffect, useState } from "react"
import Taro from "@tarojs/taro"
import { goBackToHome } from "@/lib/nav"
import {
  loadAdvancedMemories,
  insertAdvancedMemory,
  updateMemoryContent,
  toggleMemoryPin,
  purgeMemory,
  recordMemoryAccess,
  computeMemoryRetention,
  type AdvancedMemoryItem,
} from "@/lib/memoryEngine"

export type ArchiveSource = "backend" | "builtin" | "local"
export type LinkState = "linking" | "ready"

export type ArchiveProps = {
  linkState: LinkState
  source: ArchiveSource
  fragments: AdvancedMemoryItem[]
  expandedIds: string[]
  recordDrawerOpen: boolean
  setRecordDrawerOpen: (open: boolean) => void
  editingItem: AdvancedMemoryItem | null
  setEditingItem: (item: AdvancedMemoryItem | null) => void
  onToggle: (id: string) => void
  onAddRecord: (title: string, content: string, weight?: number) => void
  onUpdateRecord: (id: string, title: string, content: string) => void
  onTogglePin: (id: string) => void
  onPurgeRecord: (id: string) => void
  onBack: () => void
}

export function useArchive(): ArchiveProps {
  const [linkState] = useState<LinkState>("ready")
  const [source] = useState<ArchiveSource>("local")
  const [fragments, setFragments] = useState<AdvancedMemoryItem[]>(loadAdvancedMemories)
  const [expandedIds, setExpandedIds] = useState<string[]>([])
  const [recordDrawerOpen, setRecordDrawerOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<AdvancedMemoryItem | null>(null)

  const reloadMemories = useCallback(() => {
    setFragments(loadAdvancedMemories())
  }, [])

  useEffect(() => {
    reloadMemories()
  }, [reloadMemories])

  const onToggle = useCallback((id: string) => {
    recordMemoryAccess(id)
    setExpandedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
    reloadMemories()
  }, [reloadMemories])

  const onAddRecord = useCallback(
    (title: string, content: string, weight = 1.85) => {
      const created = insertAdvancedMemory({
        title,
        content,
        weight,
        confidenceSource: "manual_input",
        tags: ["MANUAL_RECORD", "USER_CONTROL"],
      })
      reloadMemories()
      setExpandedIds((prev) => [created.id, ...prev])
      setRecordDrawerOpen(false)
      Taro.showToast({ title: "记忆碎片已收录并注入认知闭环", icon: "none", duration: 1800 })
    },
    [reloadMemories],
  )

  const onUpdateRecord = useCallback(
    (id: string, title: string, content: string) => {
      updateMemoryContent(id, title, content)
      reloadMemories()
      setEditingItem(null)
      Taro.showToast({ title: "记忆碎片已完成主权校准", icon: "none", duration: 1600 })
    },
    [reloadMemories],
  )

  const onTogglePin = useCallback(
    (id: string) => {
      toggleMemoryPin(id)
      reloadMemories()
      Taro.showToast({ title: "记忆锁定状态已更新", icon: "none", duration: 1200 })
    },
    [reloadMemories],
  )

  const onPurgeRecord = useCallback(
    (id: string) => {
      purgeMemory(id)
      reloadMemories()
      Taro.showToast({ title: "记忆碎片已从居所物理销毁", icon: "none", duration: 1400 })
    },
    [reloadMemories],
  )

  const onBack = useCallback(() => {
    goBackToHome()
  }, [])

  return {
    linkState,
    source,
    fragments,
    expandedIds,
    recordDrawerOpen,
    setRecordDrawerOpen,
    editingItem,
    setEditingItem,
    onToggle,
    onAddRecord,
    onUpdateRecord,
    onTogglePin,
    onPurgeRecord,
    onBack,
  }
}
