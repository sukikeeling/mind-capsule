import { useState } from "react"
import { Button, Input, ScrollView, Text, Textarea, View } from "@tarojs/components"
import Taro from "@tarojs/taro"
import { buildMapArt, MAP_WIDTH, mapHeight, scenePoint, type StoryScene } from "./storyData"
import type { StoryProps } from "./useStory"

function pad2(n: number): string {
  return String(n).padStart(2, "0")
}

/* 场景节点：圆点 + 等宽日期，挂在地图虚线路径上 */
function MapNode(props: {
  scene: StoryScene
  index: number
  total: number
  expanded: boolean
  onTap: (id: string) => void
}) {
  const { scene, index, total, expanded, onTap } = props
  const p = scenePoint(index)
  const h = mapHeight(total)
  const cls = ["st-node", expanded ? "on" : "", scene.generated ? "gen" : ""].filter(Boolean).join(" ")
  return (
    <View
      className={cls}
      style={{
        left: `${((p.x / MAP_WIDTH) * 100).toFixed(2)}%`,
        top: `${((p.y / h) * 100).toFixed(2)}%`,
        animationDelay: `${Math.min(index, 10) * 110}ms`,
      }}
      onClick={() => onTap(scene.id)}
    >
      <View className="st-node-ring" />
      <View className="st-node-dot" />
      <Text className="st-node-date">{scene.dateLabel}</Text>
    </View>
  )
}

/* 场景档案卡 / 续写书信卡 */
function SceneCard(props: {
  scene: StoryScene
  index: number
  fontSize: number
  open: boolean
  typing: boolean
  onToggle: (id: string) => void
}) {
  const { scene, index, fontSize, open, typing, onToggle } = props
  const cls = ["st-card", open ? "open" : "", scene.generated ? "gen" : ""].filter(Boolean).join(" ")
  return (
    <View id={`st-scene-${scene.id}`} className={cls} onClick={() => onToggle(scene.id)}>
      <View className="st-card-top">
        <Text className="st-mono st-dim">
          {scene.generated ? `SCENE_${pad2(index + 1)} · CONTINUED` : `FIELD NOTE ${pad2(index + 1)}`}
        </Text>
        <View className="st-card-top-right">
          <Text className="st-mono st-date">{scene.dateLabel}</Text>
          <Text className="st-fold-mark">{open ? "—" : "+"}</Text>
        </View>
      </View>
      <Text className="st-card-title">{scene.title}</Text>
      <View className="st-card-body">
        <View className="st-card-body-inner">
          <Text className="st-card-content" style={{ fontSize: Taro.pxTransform(fontSize * 2) }}>
            {scene.memory}
          </Text>
          {typing ? <Text className="st-caret">▍</Text> : null}
          <Text className="st-card-sign">— EDEN 47 · FIELD ARCHIVE</Text>
        </View>
      </View>
      <View className="st-letter-fold" />
    </View>
  )
}

export function StoryView(props: StoryProps) {
  const {
    config,
    scenes,
    busy,
    typingId,
    expandedId,
    anchorId,
    customOpen,
    setCustomOpen,
    onToggle,
    onNodeTap,
    onContinue,
    onAddCustom,
    onBack,
  } = props

  const [customTitle, setCustomTitle] = useState("")
  const [customMemory, setCustomMemory] = useState("")

  const night = config.night_mode
  const still = config.motion_intensity === "reduced"
  const mapArt = buildMapArt(scenes.length, night)
  const mapH = mapHeight(scenes.length)

  const rootClass = ["story", night ? "night" : "", `grain-${config.grain_level}`, still ? "still" : ""]
    .filter(Boolean)
    .join(" ")

  const handleCustomSubmit = () => {
    if (!customMemory.trim()) {
      Taro.showToast({ title: "请填写场景记忆文字", icon: "none" })
      return
    }
    onAddCustom(customTitle, customMemory)
    setCustomTitle("")
    setCustomMemory("")
  }

  return (
    <View className={rootClass}>
      <View className="st-fold" />

      <View className="st-head">
        <View className="st-head-row">
          <View className="st-head-left">
            <Text className="st-kicker">SPECIMEN_14B / PATH / FIELD NOTE</Text>
            <Text className="st-title">Story · 场景地图</Text>
          </View>
          <View className="st-menu" onClick={onBack}>
            <Text>‹</Text>
          </View>
        </View>
        <Text className="st-sub">家把每一段路都记成了星点</Text>
      </View>

      <View className="st-status">
        <Text>VOICE BRIDGE LISTENING</Text>
        <View className="st-status-right">
          <View className="st-status-dot" />
          <Text>{busy ? "SIGNAL WRITING" : "SIGNAL READY · BAINK HOME"}</Text>
        </View>
      </View>

      <ScrollView
        className="st-scroll"
        scrollY
        scrollWithAnimation
        scrollIntoView={anchorId}
        enhanced
        showScrollbar={false}
      >
        {/* 手绘路径地图 */}
        <View className="st-map" style={{ height: Taro.pxTransform(mapH) }}>
          <View className="st-map-art" style={{ backgroundImage: mapArt }} />
          <View className="st-map-label">
            <Text className="st-mono st-dim">MAP_047 / SCALE 1:47</Text>
          </View>
          {scenes.map((scene, i) => (
            <MapNode
              key={scene.id}
              scene={scene}
              index={i}
              total={scenes.length}
              expanded={scene.id === expandedId}
              onTap={onNodeTap}
            />
          ))}
        </View>

        {/* 场景档案列表 */}
        <View className="st-list-head">
          <View className="st-list-left">
            <View className="st-list-dot" />
            <Text className="st-mono st-dim">SCENE RECORDS · THE PATH</Text>
          </View>
          <Text className="st-mono st-dim">{pad2(scenes.length)} ENTRIES</Text>
        </View>

        {scenes.map((scene, i) => (
          <SceneCard
            key={scene.id}
            scene={scene}
            index={i}
            fontSize={config.font_size}
            open={scene.id === expandedId}
            typing={scene.id === typingId}
            onToggle={onToggle}
          />
        ))}

        <View className="st-end">
          <Text className="st-mono st-dim">路还在往前，故事也是</Text>
          <Text className="st-mono st-dimmer">THE PATH CONTINUES · SEALED UNTIL NEXT SIGNAL</Text>
        </View>
      </ScrollView>

      {/* 底部操作栏：双通道（自主创作 + AI 继续场景） */}
      <View className="st-actionbar">
        <Button className="st-btn-custom" onClick={() => setCustomOpen(true)}>
          <Text className="st-btn-custom-text">自主书写 ✎</Text>
        </Button>
        <Button className={busy ? "st-continue busy" : "st-continue"} disabled={busy} onClick={() => onContinue()}>
          {busy ? (
            <View className="st-continue-busy">
              <View className="st-dot d1" />
              <View className="st-dot d2" />
              <View className="st-dot d3" />
              <Text className="st-continue-busy-text">SIGNAL LISTENING…</Text>
            </View>
          ) : (
            <Text className="st-continue-text">继续场景 ↗</Text>
          )}
        </Button>
      </View>

      {/* 用户自主创作书信抽屉 */}
      {customOpen ? (
        <View className="st-backdrop" onClick={() => setCustomOpen(false)}>
          <View className="st-sheet" onClick={(e) => e.stopPropagation()}>
            <View className="st-sheet-head">
              <View className="st-sheet-titlebox">
                <Text className="st-sheet-title">自主书写场景</Text>
                <Text className="st-sheet-sub">CUSTOM SCENE · FIELD ARCHIVE</Text>
              </View>
              <View className="st-sheet-close" onClick={() => setCustomOpen(false)}>
                <Text>×</Text>
              </View>
            </View>

            <View className="st-custom-form">
              <Text className="st-form-label">场景标题 TITLE</Text>
              <Input
                className="st-form-input"
                placeholder="给这一刻起个名字（如：回廊的晚风）"
                placeholderClass="st-form-ph"
                value={customTitle}
                onInput={(e) => setCustomTitle(e.detail.value)}
              />

              <Text className="st-form-label">场景记忆 MEMORY</Text>
              <Textarea
                className="st-form-textarea"
                placeholder="写下你们在居所里发生的一个时刻…"
                placeholderClass="st-form-ph"
                value={customMemory}
                maxlength={300}
                onInput={(e) => setCustomMemory(e.detail.value)}
              />

              <Button className="st-form-submit" onClick={handleCustomSubmit}>
                <Text className="st-form-submit-text">封存为场景 ↗</Text>
              </Button>
            </View>
          </View>
        </View>
      ) : null}

      <View className="st-grain" />
    </View>
  )
}
