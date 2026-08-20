import { useState, useEffect } from "react"
import { Button, Input, ScrollView, Text, Textarea, View } from "@tarojs/components"
import Taro from "@tarojs/taro"
import { camelliaArt, TOKEN_WARNING_TEXT } from "./archiveData"
import type { ArchiveProps } from "./useArchive"
import { computeMemoryRetention } from "@/lib/memoryEngine"

export function ArchiveView(props: ArchiveProps) {
  const {
    linkState,
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
  } = props

  const [recordTitle, setRecordTitle] = useState("")
  const [recordContent, setRecordContent] = useState("")

  const [editTitle, setEditTitle] = useState("")
  const [editContent, setEditContent] = useState("")

  useEffect(() => {
    if (editingItem) {
      setEditTitle(editingItem.title)
      setEditContent(editingItem.content)
    }
  }, [editingItem])

  const recalled = fragments.length
  const linkNote = "OB LINK · ADVANCED COGNITIVE ENGINE"

  const handleRecordSubmit = () => {
    if (!recordContent.trim()) {
      Taro.showToast({ title: "请填写回忆内容", icon: "none" })
      return
    }
    onAddRecord(recordTitle, recordContent, 1.88)
    setRecordTitle("")
    setRecordContent("")
  }

  const handleEditSubmit = () => {
    if (!editingItem) return
    if (!editContent.trim()) {
      Taro.showToast({ title: "回忆内容不能为空", icon: "none" })
      return
    }
    onUpdateRecord(editingItem.id, editTitle, editContent)
  }

  return (
    <View className="eden-archive">
      <ScrollView scrollY className="arch-scroll" enhanced showScrollbar={false}>
        <View className="arch-head">
          <View className="arch-watermark">
            <Text>ARCHIVE_FILE</Text>
            <Text>OB_47 / STRATA</Text>
          </View>
          <View className="arch-camellia" style={{ backgroundImage: camelliaArt }} />

          <View className="arch-head-top">
            <Text className="arch-mono dim">// SPECIMEN_08A / OBSIDIAN / COGNITION</Text>
            <View className="arch-head-top-right">
              <View className="arch-online">
                <View className="arch-online-dot" />
                <Text className="arch-mono dim">DECAY & CONFLICT ENGINE ACTIVE</Text>
              </View>
              <View className="arch-menu" onClick={onBack}>
                <Text>‹</Text>
              </View>
            </View>
          </View>

          <View className="arch-hero">
            <View className="arch-hero-left">
              <Text className="arch-title">共同记忆 · Shared Archive</Text>
              <Text className="arch-sub">动态衰减、冲突演化与置信度画像</Text>
              <Text className="arch-sub dim2">生命周期的每一寸心跳，均由用户完全掌控。</Text>
            </View>
            <View className="arch-hero-right">
              <Text className="arch-bignum">{recalled}</Text>
              <Text className="arch-mono dim">FRAGMENTS</Text>
            </View>
          </View>

          <View className="arch-keepers">
            <View className="keeper k1">
              <Text>47</Text>
            </View>
            <View className="keeper k2">
              <Text>B</Text>
            </View>
            <View className="keeper k3">
              <Text>N</Text>
            </View>
            <View className="arch-keepers-note">
              <Text className="arch-mono dim">3 KEEPERS</Text>
              <Text className="arch-mono dim">EBBINGHAUS & PREFERENCE ON</Text>
            </View>
          </View>

          <View className="arch-count">
            <Text className="arch-mono">已载入认知碎片 {recalled} / 372</Text>
            <Text className="arch-mono dim">{linkNote}</Text>
          </View>
        </View>

        <View className="arch-list-head">
          <View className="arch-list-left">
            <View className="arch-list-dot" />
            <Text className="arch-mono dim">OB · COGNITIVE STRATA</Text>
          </View>
          <View className="arch-list-actions">
            <View className="arch-add-btn" onClick={() => setRecordDrawerOpen(true)}>
              <Text className="arch-add-btn-text">沉淀认知 📌</Text>
            </View>
            <Text className="arch-mono dim">{String(recalled).padStart(2, "0")} RECORDS</Text>
          </View>
        </View>

        <View className="arch-timeline">
          {fragments.map((frag, i) => {
            const open = expandedIds.includes(frag.id)
            const retention = computeMemoryRetention(frag)
            const retentionPct = Math.round(retention * 100)
            const confidencePct = Math.round(frag.confidence * 100)

            return (
              <View
                key={frag.id}
                className={`arch-card${open ? " open" : ""}${frag.real ? " real" : ""}${frag.conflictStatus === "superseded" ? " superseded" : ""}`}
                style={{ animationDelay: `${Math.min(i, 11) * 70}ms` }}
                onClick={() => onToggle(frag.id)}
              >
                <View className="arch-node" />
                <View className="arch-card-top">
                  <View className="arch-card-top-left">
                    <Text className="arch-mono dim">
                      {frag.code} · [bucket:{frag.bucketId.slice(0, 8)}]
                    </Text>
                    {frag.pinned ? <Text className="arch-pin-badge">📌 PINNED (无衰减)</Text> : null}
                    {frag.conflictStatus === "superseded" ? (
                      <Text className="arch-superseded-badge">⚠️ 已演进替代</Text>
                    ) : null}
                  </View>
                  <View className="arch-card-top-right">
                    <Text className="arch-mono weight">[权重:{frag.currentWeight.toFixed(2)}]</Text>
                    <Text className="arch-fold">{open ? "—" : "+"}</Text>
                  </View>
                </View>

                {/* 记忆元指标：置信度与艾宾浩斯保持率 */}
                <View className="arch-metrics-bar">
                  <View className="arch-metric">
                    <Text className="metric-label">置信度:</Text>
                    <Text className="metric-val">{confidencePct}%</Text>
                  </View>
                  <View className="arch-metric">
                    <Text className="metric-label">记忆保持率:</Text>
                    <Text className="metric-val">{frag.pinned ? "100% (锁定)" : `${retentionPct}%`}</Text>
                  </View>
                  <View className="arch-metric">
                    <Text className="metric-label">调用频次:</Text>
                    <Text className="metric-val">{frag.accessCount || 1}次</Text>
                  </View>
                </View>

                <Text className="arch-card-title">{frag.title}</Text>
                
                <View className="arch-card-body">
                  <View className="arch-card-body-inner">
                    <Text className="arch-card-content">{frag.content}</Text>
                    {frag.conflictReason ? (
                      <Text className="arch-conflict-note">【演化记录】{frag.conflictReason}</Text>
                    ) : null}
                  </View>
                </View>

                {/* 用户主权控制按钮组 (User Control) */}
                <View className="arch-control-row" onClick={(e) => e.stopPropagation()}>
                  <View
                    className={`arch-ctl-btn${frag.pinned ? " on" : ""}`}
                    onClick={() => onTogglePin(frag.id)}
                  >
                    <Text>{frag.pinned ? "已置顶锁定" : "📌 置顶保护"}</Text>
                  </View>
                  <View
                    className="arch-ctl-btn"
                    onClick={() => setEditingItem(frag)}
                  >
                    <Text>✎ 编辑主权</Text>
                  </View>
                  <View
                    className="arch-ctl-btn danger"
                    onClick={() => onPurgeRecord(frag.id)}
                  >
                    <Text>🗑️ 物理销毁</Text>
                  </View>
                </View>

                <View className="arch-tags">
                  {frag.tags.map((t) => (
                    <Text key={t} className="arch-tag">
                      {t}
                    </Text>
                  ))}
                </View>
              </View>
            )
          })}

          <View className="arch-end">
            <Text className="arch-mono dim">更早的碎片沉在档案底层</Text>
            <Text className="arch-mono dimmer">DEEPER STRATA · CONTINUOUS EVOLVING</Text>
          </View>
        </View>
      </ScrollView>

      <View className="arch-tokenbar">
        <View className="arch-token-dot" />
        <Text className="arch-token-text">{TOKEN_WARNING_TEXT}</Text>
      </View>

      {/* 记录新碎片抽屉 */}
      {recordDrawerOpen ? (
        <View className="arch-backdrop" onClick={() => setRecordDrawerOpen(false)}>
          <View className="arch-sheet" onClick={(e) => e.stopPropagation()}>
            <View className="arch-sheet-head">
              <View className="arch-sheet-titlebox">
                <Text className="arch-sheet-title">沉淀新认知碎片</Text>
                <Text className="arch-sheet-sub">RECORD FRAGMENT · WITH CONFIDENCE SCORING</Text>
              </View>
              <View className="arch-sheet-close" onClick={() => setRecordDrawerOpen(false)}>
                <Text>×</Text>
              </View>
            </View>

            <View className="arch-record-form">
              <Text className="arch-form-label">记忆标题 TITLE</Text>
              <Input
                className="arch-form-input"
                placeholder="给这段记忆命名（如：下周备考科目规划）"
                value={recordTitle}
                onInput={(e) => setRecordTitle(e.detail.value)}
              />

              <Text className="arch-form-label">回忆正文 CONTENT</Text>
              <Textarea
                className="arch-form-textarea"
                placeholder="记下任何值得在居所里长久保存的瞬间或日程偏好…"
                value={recordContent}
                maxlength={400}
                onInput={(e) => setRecordContent(e.detail.value)}
              />

              <Button className="arch-form-submit" onClick={handleRecordSubmit}>
                <Text className="arch-form-submit-text">封存入黑曜石档案 ↗</Text>
              </Button>
            </View>
          </View>
        </View>
      ) : null}

      {/* 编辑已有碎片抽屉 (Memory Editing) */}
      {editingItem ? (
        <View className="arch-backdrop" onClick={() => setEditingItem(null)}>
          <View className="arch-sheet" onClick={(e) => e.stopPropagation()}>
            <View className="arch-sheet-head">
              <View className="arch-sheet-titlebox">
                <Text className="arch-sheet-title">校准记忆碎片 · 用户主权</Text>
                <Text className="arch-sheet-sub">CALIBRATE MEMORY [{editingItem.code}]</Text>
              </View>
              <View className="arch-sheet-close" onClick={() => setEditingItem(null)}>
                <Text>×</Text>
              </View>
            </View>

            <View className="arch-record-form">
              <Text className="arch-form-label">修改标题 TITLE</Text>
              <Input
                className="arch-form-input"
                value={editTitle}
                onInput={(e) => setEditTitle(e.detail.value)}
              />

              <Text className="arch-form-label">修改正文 CONTENT</Text>
              <Textarea
                className="arch-form-textarea"
                value={editContent}
                maxlength={400}
                onInput={(e) => setEditContent(e.detail.value)}
              />

              <Button className="arch-form-submit" onClick={handleEditSubmit}>
                <Text className="arch-form-submit-text">保存并更新置信度 (100%) ↗</Text>
              </Button>
            </View>
          </View>
        </View>
      ) : null}

      <View className="eden-grain" />
    </View>
  )
}
