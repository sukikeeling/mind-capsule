import { Canvas, View, Text } from "@tarojs/components"
import type { MusicBoxProps, Track } from "./useMusicBox"
import { durationToSec, formatClock } from "./useMusicBox"

const FALLBACK_TRACK: Track = {
  id: "empty",
  track_no: 0,
  title: "SIGNAL SEARCHING",
  artist: "EDEN 47",
  duration: "04:00",
  companion_note: "信号搜寻中，唱片稍后起转。",
}

export function MusicBoxView(props: MusicBoxProps) {
  const {
    themeMode,
    playState,
    tracks,
    currentIndex,
    elapsedSec,
    canvasId,
    onToggleTheme,
    onTogglePlay,
    onPrev,
    onNext,
    onSelect,
    onBack,
  } = props

  const night = themeMode === "night"
  const playing = playState === "playing"
  const current = tracks[currentIndex] ?? FALLBACK_TRACK
  const durationSec = durationToSec(current.duration)
  const pct = Math.min(100, (elapsedSec / durationSec) * 100)

  return (
    <View className={night ? "mbox night" : "mbox"}>
      <View className="mb-nebula" />

      <View className="mb-head">
        <View className="mb-head-left">
          <Text className="mb-kicker">SPECIMEN_10A / WINE / SIGNAL</Text>
          <Text className="mb-title">音乐盒 · Domestic Radio</Text>
        </View>
        <View className="mb-head-actions">
          <View className="mb-mode-btn" onClick={onToggleTheme}>
            <View className="mb-mode-dot" />
            <Text>{night ? "IVORY" : "NIGHT"}</Text>
          </View>
          <View className="mb-menu" onClick={onBack}>
            <Text>‹</Text>
          </View>
        </View>
      </View>

      <View className="mb-meta">
        <View className="mb-meta-col">
          <Text>CHANNEL_03 / PRIVATE</Text>
          <Text>LOSSLESS · 48 KHZ</Text>
        </View>
        <View className="mb-meta-col right">
          <Text>{playing ? "SIGNAL READY" : "SIGNAL HELD"}</Text>
          <Text>QUEUE {String(tracks.length).padStart(2, "0")}</Text>
        </View>
      </View>

      <View className="mb-player">
        <View className="mb-stage">
          <View className={playing ? "mb-disc" : "mb-disc halted"} />
          <View className="mb-disc-label">
            <Text className="mb-label-top">EDEN · 47</Text>
            <Text className="mb-label-mid">NOW PLAYING</Text>
            <Text className="mb-label-no">{String(current.track_no).padStart(2, "0")}</Text>
          </View>
          <View className="mb-sleeve" />
        </View>

        <View className="mb-now-right">
          <View className="mb-now" key={current.id}>
            <Text className="mb-now-kicker">NOW PLAYING · HOME SIGNAL</Text>
            <Text className="mb-now-title">{current.title}</Text>
            <Text className="mb-now-artist">{current.artist}</Text>
            <View className="mb-note">
              <Text>{current.companion_note}</Text>
            </View>
          </View>
          <Canvas type="2d" id={canvasId} className="mb-spectrum" />
        </View>
      </View>

      <View className="mb-progress">
        <View className="mb-bar">
          <View className="mb-bar-fill" style={{ width: `${pct}%` }} />
          <View className="mb-dot" style={{ left: `${pct}%` }} />
        </View>
        <View className="mb-times">
          <Text>{formatClock(elapsedSec)}</Text>
          <Text>{current.duration}</Text>
        </View>
      </View>

      <View className="mb-controls">
        <View className="mb-ctl-side" onClick={onPrev}>
          <Text className="mb-ctl-glyph">‹</Text>
        </View>
        <View className="mb-ctl-main" onClick={onTogglePlay}>
          {playing ? (
            <View className="mb-pause-bars">
              <View className="mb-pause-bar" />
              <View className="mb-pause-bar" />
            </View>
          ) : (
            <View className="mb-play-tri" />
          )}
        </View>
        <View className="mb-ctl-side" onClick={onNext}>
          <Text className="mb-ctl-glyph">›</Text>
        </View>
        <View className="mb-loop">
          <Text>∞</Text>
        </View>
      </View>

      <View className="mb-list-head">
        <Text className="mb-list-title">PLAYLIST · 播放列表</Text>
        <Text className="mb-list-side">EDEN ARCHIVE · {String(tracks.length).padStart(2, "0")}</Text>
      </View>

      <View className="mb-rows">
        {tracks.map((track, i) => {
          const on = i === currentIndex
          return (
            <View key={track.id} className={on ? "mb-row mb-row-on" : "mb-row"} onClick={() => onSelect(i)}>
              <Text className={on ? "mb-row-mark" : "mb-row-no"}>
                {on ? "▶" : String(i + 1).padStart(2, "0")}
              </Text>
              <View className="mb-row-main">
                <Text className="mb-row-title">{track.title}</Text>
                <Text className="mb-row-artist">{track.artist}</Text>
              </View>
              <Text className="mb-row-dur">{track.duration}</Text>
            </View>
          )
        })}
      </View>

      <Text className="mb-foot">EDEN 47 · DOMESTIC RADIO — THE SIGNAL KEEPS</Text>

      <View className="mb-grain" />
    </View>
  )
}
