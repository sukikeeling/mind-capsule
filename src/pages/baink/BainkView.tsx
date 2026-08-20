import { useEffect, useState } from "react"
import { Button, Input, ScrollView, Text, View } from "@tarojs/components"
import Taro from "@tarojs/taro"
import {
  MODEL_META,
  PLAYER_TRACK,
  VOICE_OPTIONS,
  type BainkProps,
  type ChatMessage,
} from "./useBaink"
import { speakText, stopSpeaking, isSpeaking } from "@/lib/tts"
import { ApiConfigDrawer } from "@/components/ApiConfigDrawer"

/* 波形意象：内联 SVG data-uri（零位图） */
function waveUri(color: string, animated = false): string {
  const heights = [10, 18, 26, 14, 30, 22, 12, 26, 34, 18, 10, 24, 30, 16, 22, 12, 28, 20, 14, 26, 18, 10, 22, 30, 14, 20, 26, 12, 18, 24]
  const bars = heights
    .map((h, i) => {
      const liveH = animated ? Math.max(6, Math.min(38, h + (Math.sin(i * 0.8) * 8))) : h
      return `<rect x='${i * 7}' y='${(40 - liveH) / 2}' width='3.5' height='${liveH}' rx='1.75' fill='${color}'/>`
    })
    .join("")
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 210 40'>${bars}</svg>`
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`
}

function playGlyphUri(color: string, isPlaying = false): string {
  if (isPlaying) {
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'><circle cx='20' cy='20' r='19' fill='none' stroke='${color}' stroke-width='1.5'/><rect x='14' y='13' width='3.5' height='14' fill='${color}'/><rect x='22.5' y='13' width='3.5' height='14' fill='${color}'/></svg>`
    return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`
  }
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'><circle cx='20' cy='20' r='19' fill='none' stroke='${color}' stroke-width='1.5'/><path d='M16 12 L30 20 L16 28 Z' fill='${color}'/></svg>`
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`
}

/* 书信正文：反引号片段渲染为等宽高亮行内代码 */
function RichLetter({ text, fontSize }: { text: string; fontSize: number }) {
  const parts = text.split(/(`[^`]*`?)/g)
  return (
    <Text className="bk-letter-body" style={{ fontSize: Taro.pxTransform(fontSize * 2) }}>
      {parts.map((part, i) => {
        if (part.startsWith("`") && part.endsWith("`") && part.length >= 2) {
          const code = part.slice(1, part.length > 2 ? -1 : undefined)
          return (
            <Text key={i} className="bk-code">
              {code}
            </Text>
          )
        }
        return <Text key={i}>{part}</Text>
      })}
    </Text>
  )
}

function AudioBar(props: {
  night: boolean
  tag: string
  isPlaying: boolean
  onToggleSpeech: () => void
  onOpenPlayer: () => void
}) {
  const { night, tag, isPlaying, onToggleSpeech, onOpenPlayer } = props
  const color = night ? "#7FB8C7" : "#1D3B34"
  const wave = waveUri(color, isPlaying)

  return (
    <View className={`bk-voice ${isPlaying ? "playing" : ""}`} onClick={onToggleSpeech}>
      <View className="bk-voice-play" style={{ backgroundImage: playGlyphUri(color, isPlaying) }} />
      <View className="bk-voice-wave" style={{ backgroundImage: wave }} />
      <View className="bk-voice-meta">
        <Text className="bk-voice-time">{isPlaying ? "PLAYING" : "00:32"}</Text>
        <Text className="bk-voice-tag">{isPlaying ? "VOICE READING 🔊" : tag}</Text>
      </View>
    </View>
  )
}

function LetterCard(props: {
  msg: ChatMessage
  night: boolean
  fontSize: number
  voiceTag: string
  isCurrentlySpeaking: boolean
  onToggleSpeech: () => void
  onOpenPlayer: () => void
}) {
  const { msg, night, fontSize, voiceTag, isCurrentlySpeaking, onToggleSpeech, onOpenPlayer } = props
  return (
    <View className="bk-letter">
      <View className="bk-letter-head">
        <Text className="bk-letter-no">LETTER №{String(msg.letterNo).padStart(2, "0")} · BAINK</Text>
        <Text className="bk-letter-model">{msg.modelTag ?? ""}</Text>
      </View>
      {msg.phase === "thinking" ? (
        <View className="bk-thinking">
          <Text className="bk-thinking-label">SIGNAL LISTENING</Text>
          <View className="bk-thinking-dots">
            <View className="bk-dot d1" />
            <View className="bk-dot d2" />
            <View className="bk-dot d3" />
          </View>
        </View>
      ) : (
        <RichLetter text={msg.content} fontSize={fontSize} />
      )}
      {msg.phase === "streaming" ? <Text className="bk-caret">▍</Text> : null}
      {msg.phase === "error" ? <Text className="bk-letter-error">SIGNAL WEAK</Text> : null}
      {msg.hasAudio || msg.phase === "done" ? (
        <AudioBar
          night={night}
          tag={voiceTag}
          isPlaying={isCurrentlySpeaking}
          onToggleSpeech={onToggleSpeech}
          onOpenPlayer={onOpenPlayer}
        />
      ) : null}
      <View className="bk-letter-fold" />
    </View>
  )
}

export function BainkView(props: BainkProps) {
  const {
    config,
    messages,
    busy,
    input,
    setInput,
    send,
    models,
    model,
    pickModel,
    voice,
    pickVoice,
    configOpen,
    setConfigOpen,
    apiDrawerOpen,
    setApiDrawerOpen,
    playerOpen,
    setPlayerOpen,
    anchorId,
    onBack,
  } = props

  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null)

  const night = config.night_mode
  const still = config.motion_intensity === "reduced"
  const voiceOpt = VOICE_OPTIONS.find((o) => o.value === voice) ?? VOICE_OPTIONS[1]

  const handleToggleSpeech = (msg: ChatMessage) => {
    if (speakingMsgId === msg.id && isSpeaking()) {
      stopSpeaking()
      setSpeakingMsgId(null)
      return
    }
    setSpeakingMsgId(msg.id)
    const started = speakText(msg.content, {
      lang: voice === "en-clone" ? "en" : "zh",
      onEnd: () => setSpeakingMsgId(null),
    })
    if (!started) {
      setSpeakingMsgId(null)
      setPlayerOpen(true)
    }
  }

  useEffect(() => {
    return () => {
      stopSpeaking()
    }
  }, [])

  const rootClass = ["baink", night ? "night" : "", `grain-${config.grain_level}`, still ? "still" : ""]
    .filter(Boolean)
    .join(" ")

  return (
    <View className={rootClass}>
      <View className="bk-fold" />

      <View className="bk-head">
        <View className="bk-head-row">
          <View className="bk-head-left">
            <Text className="bk-kicker">SPECIMEN_16A / ARGENT / HOME</Text>
            <Text className="bk-title">Baink</Text>
          </View>
          <View className="bk-head-actions">
            <View className="bk-api-badge" onClick={() => setApiDrawerOpen(true)}>
              <Text className="bk-api-badge-text">API ⚙</Text>
            </View>
            <View className="bk-menu" onClick={onBack}>
              <Text>‹</Text>
            </View>
          </View>
        </View>
        <Text className="bk-bond">baink 是 47 的。47 是 baink 的。</Text>
      </View>

      <View className="bk-status">
        <Text>EDEN / READING COMPANION</Text>
        <View className="bk-status-right">
          <View className="bk-status-dot" />
          <Text>{busy ? "SIGNAL WRITING" : "CHANNEL OPEN · LINK STABLE"}</Text>
        </View>
      </View>

      <ScrollView
        className="bk-chat"
        scrollY
        scrollWithAnimation
        scrollIntoView={anchorId}
        enhanced
        showScrollbar={false}
      >
        {messages.map((msg) =>
          msg.role === "assistant" ? (
            <LetterCard
              key={msg.id}
              msg={msg}
              night={night}
              fontSize={config.font_size}
              voiceTag={voiceOpt.tag}
              isCurrentlySpeaking={speakingMsgId === msg.id}
              onToggleSpeech={() => handleToggleSpeech(msg)}
              onOpenPlayer={() => setPlayerOpen(true)}
            />
          ) : (
            <View key={msg.id} className="bk-user">
              <Text className="bk-user-text">{msg.content}</Text>
            </View>
          ),
        )}
        <View id={anchorId} className="bk-anchor" />
      </ScrollView>

      <View className="bk-inputbar">
        <View className={configOpen ? "bk-glyph on" : "bk-glyph"} onClick={() => setConfigOpen(!configOpen)}>
          <Text>◈</Text>
        </View>
        <View className="bk-input-wrap">
          <Input
            className="bk-input"
            value={input}
            placeholder="写一封信给 Baink…"
            placeholderClass="bk-input-ph"
            confirmType="send"
            adjustPosition
            disabled={busy}
            onInput={(e: any) => {
              const val = e?.detail?.value ?? e?.target?.value ?? ""
              setInput(val)
            }}
            onKeyDown={(e: any) => {
              if (e.key === "Enter") {
                send()
              }
            }}
            onConfirm={() => send()}
          />
        </View>
        <Button
          className={busy ? "bk-send busy" : "bk-send"}
          disabled={busy}
          onClick={(e: any) => {
            e?.stopPropagation?.()
            send()
          }}
        >
          <Text className="bk-send-text">{busy ? "传输中" : "寄出"}</Text>
        </Button>
      </View>

      {/* 房间配置 · 底部抽屉 */}
      {configOpen ? (
        <View className="bk-backdrop" onClick={() => setConfigOpen(false)}>
          <View className="bk-sheet" onClick={(e) => e.stopPropagation()}>
            <View className="bk-sheet-head">
              <View className="bk-sheet-titlebox">
                <Text className="bk-sheet-title">房间配置</Text>
                <Text className="bk-sheet-sub">ROOM CONFIG · SPECIMEN_16A</Text>
              </View>
              <View className="bk-sheet-close" onClick={() => setConfigOpen(false)}>
                <Text>×</Text>
              </View>
            </View>

            <Text className="bk-sec-label">01 · 伴读模型 MODEL</Text>
            <View className="bk-model-list">
              {models.map((short) => {
                const meta = MODEL_META[short]
                const on = short === model
                return (
                  <View key={short} className={on ? "bk-model-row on" : "bk-model-row"} onClick={() => pickModel(short)}>
                    <View className="bk-model-dot" />
                    <View className="bk-model-main">
                      <Text className="bk-model-name">{meta.label}</Text>
                      <Text className="bk-model-note">{meta.note}</Text>
                    </View>
                    <Text className="bk-model-code">{meta.code}</Text>
                  </View>
                )
              })}
            </View>

            <Text className="bk-sec-label">02 · 语音通道 VOICE</Text>
            <View className="bk-voice-seg">
              {VOICE_OPTIONS.map((opt) => (
                <View
                  key={opt.value}
                  className={opt.value === voice ? "bk-voice-btn on" : "bk-voice-btn"}
                  onClick={() => pickVoice(opt.value)}
                >
                  <Text className="bk-voice-btn-text">{opt.label}</Text>
                </View>
              ))}
            </View>

            <View
              className="bk-api-btn"
              onClick={() => {
                setConfigOpen(false)
                setApiDrawerOpen(true)
              }}
            >
              <Text className="bk-api-btn-text">配置自定义 API 接口通道 ⚡</Text>
            </View>

            <Text className="bk-sheet-foot">BAINK ROOM · CONFIG SAVED TO HOUSE</Text>
          </View>
        </View>
      ) : null}

      {/* 伴读歌词 · 悬浮面板 */}
      {playerOpen ? (
        <View className="bk-backdrop" onClick={() => setPlayerOpen(false)}>
          <View className="bk-sheet bk-sheet-player" onClick={(e) => e.stopPropagation()}>
            <View className="bk-sheet-head">
              <View className="bk-sheet-titlebox">
                <Text className="bk-sheet-title">NOW PLAYING · {PLAYER_TRACK.position}</Text>
                <Text className="bk-sheet-sub">{PLAYER_TRACK.no} · {voiceOpt.tag}</Text>
              </View>
              <View className="bk-sheet-close" onClick={() => setPlayerOpen(false)}>
                <Text>×</Text>
              </View>
            </View>

            <Text className="bk-player-title">{PLAYER_TRACK.title}</Text>

            <View className="bk-player-lines">
              {PLAYER_TRACK.lines.map((line, i) => (
                <Text key={i} className={i === 0 ? "bk-player-line on" : "bk-player-line"}>
                  {line}
                </Text>
              ))}
            </View>

            <View className="bk-player-wave" style={{ backgroundImage: waveUri(night ? "#7FB8C7" : "#1D3B34", isSpeaking()) }} />

            <View className="bk-player-progress">
              <View className="bk-player-track">
                <View className="bk-player-fill" />
              </View>
              <View className="bk-player-times">
                <Text>{PLAYER_TRACK.position}</Text>
                <Text>{PLAYER_TRACK.duration}</Text>
              </View>
            </View>

            <Text className="bk-sheet-foot">VISUAL PLAYBACK · WEB SPEECH LINKED</Text>
          </View>
        </View>
      ) : null}

      {/* API 接入抽屉 */}
      <ApiConfigDrawer open={apiDrawerOpen} onClose={() => setApiDrawerOpen(false)} />

      <View className="bk-grain" />
    </View>
  )
}
