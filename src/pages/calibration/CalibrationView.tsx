import { useState } from "react"
import { View, Text } from "@tarojs/components"
import Taro from "@tarojs/taro"
import { ApiConfigDrawer } from "@/components/ApiConfigDrawer"
import type { CalibrationProps, SegmentOption } from "./useCalibration"
import {
  FONT_OPTIONS,
  DENSITY_OPTIONS,
  MOTION_OPTIONS,
  GRAIN_OPTIONS,
  PREVIEW_TEXT,
} from "./useCalibration"

function SegmentedControl<T extends string | number>(props: {
  options: SegmentOption<T>[]
  value: T
  mono?: boolean
  onPick: (value: T) => void
}) {
  const { options, value, mono, onPick } = props
  return (
    <View className="cal-seg">
      {options.map((opt) => {
        const on = opt.value === value
        return (
          <View
            key={String(opt.value)}
            className={on ? "cal-seg-btn on" : "cal-seg-btn"}
            onClick={() => onPick(opt.value)}
          >
            <Text className={mono ? "cal-seg-text mono" : "cal-seg-text"}>{opt.label}</Text>
          </View>
        )
      })}
    </View>
  )
}

function ToggleSwitch(props: { on: boolean; onToggle: () => void }) {
  const { on, onToggle } = props
  return (
    <View className={on ? "cal-switch on" : "cal-switch"} onClick={onToggle}>
      <Text className="cal-switch-state">{on ? "ON" : "OFF"}</Text>
      <View className="cal-switch-knob" />
    </View>
  )
}

export function CalibrationView(props: CalibrationProps) {
  const { config, syncState, savedFlash, onPatch, onBack } = props
  const [apiDrawerOpen, setApiDrawerOpen] = useState(false)

  const night = config.night_mode
  const still = config.motion_intensity === "reduced"

  const rootClass = [
    "cal",
    night ? "night" : "",
    `den-${config.density}`,
    `grain-${config.grain_level}`,
    still ? "still" : "",
  ]
    .filter(Boolean)
    .join(" ")

  return (
    <View className={rootClass}>
      <View className="cal-fold" />

      <View className="cal-head">
        <View className="cal-head-left">
          <Text className="cal-kicker">SPECIMEN_04A / DIAL / SYSTEM</Text>
          <Text className="cal-title">全屋校准 · INDEX 0</Text>
          <Text className="cal-sub">调整共同的观看、对话与连接方式；人物本身仍由各自房间保存。</Text>
        </View>
        <View className="cal-menu" onClick={onBack}>
          <Text>‹</Text>
        </View>
      </View>

      <View className="cal-status">
        <Text>EDEN / DOMESTIC SYSTEM</Text>
        <View className="cal-status-right">
          <View className="cal-status-dot" />
          <Text>{syncState === "ready" ? "CALIBRATION READY" : "SIGNAL SEARCHING"}</Text>
        </View>
      </View>

      <View className="cal-preview">
        <View className="cal-preview-no">
          <Text>00</Text>
        </View>
        <View className="cal-preview-main">
          <Text className="cal-preview-label">LIVE SAMPLE · CHAT SURFACE</Text>
          <View className="cal-bubble">
            <Text className="cal-bubble-text" style={{ fontSize: Taro.pxTransform(config.font_size * 2) }}>
              {PREVIEW_TEXT}
            </Text>
          </View>
        </View>
        <View className="cal-preview-fold" />
      </View>

      <View className="cal-card">
        <View className="cal-sec-head">
          <Text className="cal-sec-no">01</Text>
          <View className="cal-sec-titlebox">
            <Text className="cal-sec-title">观看与阅读</Text>
            <Text className="cal-sec-sub">TYPE / DENSITY / MATERIAL</Text>
          </View>
          <Text className="cal-sec-glyph">—</Text>
        </View>
        <View className="cal-rows">
          <View className="cal-row">
            <View className="cal-row-label">
              <Text className="cal-row-name">聊天字号</Text>
              <Text className="cal-row-sub">{config.font_size} PX · CUSTOM</Text>
            </View>
            <SegmentedControl
              mono
              options={FONT_OPTIONS.map((v) => ({ value: v, label: String(v) }))}
              value={config.font_size}
              onPick={(v) => onPatch({ font_size: v })}
            />
          </View>
          <View className="cal-row">
            <View className="cal-row-label">
              <Text className="cal-row-name">界面密度</Text>
              <Text className="cal-row-sub">STANDARD</Text>
            </View>
            <SegmentedControl
              options={DENSITY_OPTIONS}
              value={config.density}
              onPick={(v) => onPatch({ density: v })}
            />
          </View>
          <View className="cal-row">
            <View className="cal-row-label">
              <Text className="cal-row-name">动效强度</Text>
              <Text className="cal-row-sub">SOFT SIGNAL</Text>
            </View>
            <SegmentedControl
              options={MOTION_OPTIONS}
              value={config.motion_intensity}
              onPick={(v) => onPatch({ motion_intensity: v })}
            />
          </View>
          <View className="cal-row cal-row-last">
            <View className="cal-row-label">
              <Text className="cal-row-name">纸面材质</Text>
              <Text className="cal-row-sub">STANDARD GRAIN</Text>
            </View>
            <SegmentedControl
              options={GRAIN_OPTIONS}
              value={config.grain_level}
              onPick={(v) => onPatch({ grain_level: v })}
            />
          </View>
        </View>
      </View>

      <View className="cal-card">
        <View className="cal-sec-head">
          <Text className="cal-sec-no">02</Text>
          <View className="cal-sec-titlebox">
            <Text className="cal-sec-title">对话习惯</Text>
            <Text className="cal-sec-sub">THINK / TOOL / STREAM</Text>
          </View>
          <Text className="cal-sec-glyph">＋</Text>
        </View>
        <View className="cal-rows">
          <View className="cal-row">
            <View className="cal-row-label">
              <Text className="cal-row-name">THINK 默认收起</Text>
              <Text className="cal-row-sub">THINK COLLAPSED</Text>
            </View>
            <ToggleSwitch
              on={config.think_collapsed}
              onToggle={() => onPatch({ think_collapsed: !config.think_collapsed })}
            />
          </View>
          <View className="cal-row">
            <View className="cal-row-label">
              <Text className="cal-row-name">工具默认收起</Text>
              <Text className="cal-row-sub">TOOLS COLLAPSED</Text>
            </View>
            <ToggleSwitch
              on={config.tools_collapsed}
              onToggle={() => onPatch({ tools_collapsed: !config.tools_collapsed })}
            />
          </View>
          <View className="cal-row cal-row-last">
            <View className="cal-row-label">
              <Text className="cal-row-name">流式文字</Text>
              <Text className="cal-row-sub">STREAMING TEXT</Text>
            </View>
            <ToggleSwitch
              on={config.streaming_text}
              onToggle={() => onPatch({ streaming_text: !config.streaming_text })}
            />
          </View>
        </View>
      </View>

      <View className="cal-card">
        <View className="cal-sec-head">
          <Text className="cal-sec-no">03</Text>
          <View className="cal-sec-titlebox">
            <Text className="cal-sec-title">白夜模式</Text>
            <Text className="cal-sec-sub">IVORY / NIGHT</Text>
          </View>
          <Text className="cal-sec-glyph">＋</Text>
        </View>
        <View className="cal-rows">
          <View className="cal-row cal-row-last">
            <View className="cal-row-label">
              <Text className="cal-row-name">夜模 · 深空黑</Text>
              <Text className="cal-row-sub">{night ? "NIGHT · NEBULA" : "IVORY · PAPER"}</Text>
            </View>
            <ToggleSwitch on={night} onToggle={() => onPatch({ night_mode: !night })} />
          </View>
        </View>
      </View>

      <View className="cal-card">
        <View className="cal-sec-head">
          <Text className="cal-sec-no">04</Text>
          <View className="cal-sec-titlebox">
            <Text className="cal-sec-title">API 接口与中枢通道</Text>
            <Text className="cal-sec-sub">OPENAI / CLAUDE / CUSTOM LLM & TTS</Text>
          </View>
          <Text className="cal-sec-glyph">＋</Text>
        </View>
        <View className="cal-rows">
          <View className="cal-row cal-row-last">
            <View className="cal-row-label">
              <Text className="cal-row-name">自定义大模型连接</Text>
              <Text className="cal-row-sub">DIRECT IN-BROWSER BRIDGE</Text>
            </View>
            <View className="cal-api-btn" onClick={() => setApiDrawerOpen(true)}>
              <Text className="cal-api-btn-text">配置 API 密钥与地址 ⚡</Text>
            </View>
          </View>
        </View>
      </View>

      <Text className="cal-foot">EDEN 47 · HOUSE CALIBRATION — BREATHE WITH THE HOUSE</Text>

      <View className={savedFlash ? "cal-save on" : "cal-save"}>
        <Text>CALIBRATION SAVED · HOUSE BREATHING</Text>
      </View>

      {/* API 抽屉 */}
      <ApiConfigDrawer open={apiDrawerOpen} onClose={() => setApiDrawerOpen(false)} />

      <View className="cal-grain" />
    </View>
  )
}
