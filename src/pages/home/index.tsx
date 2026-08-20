import { useEffect, useRef, useState } from "react"
import { View, Text } from "@tarojs/components"
import Taro from "@tarojs/taro"
import type { CSSProperties } from "react"
import { SPECIMEN_CARDS, ritualBaseArt, ritualDoorArt, ritualFigureArt } from "./cards"
import "./index.css"

type Phase = "ritual" | "flip" | "compass"

const SPRING = "cubic-bezier(0.25, 1, 0.5, 1)"
const CARD_COUNT = SPECIMEN_CARDS.length

const CARD_AMBIENT_GLOW: Record<string, string> = {
  baink: "radial-gradient(circle at 50% 45%, rgba(29, 59, 52, 0.16) 0%, rgba(243, 240, 233, 0.2) 45%, transparent 70%)",
  "music-box": "radial-gradient(circle at 50% 45%, rgba(255, 94, 87, 0.18) 0%, rgba(15, 23, 42, 0.22) 50%, transparent 74%)",
  archive: "radial-gradient(circle at 50% 45%, rgba(127, 184, 199, 0.18) 0%, transparent 70%)",
  story: "radial-gradient(circle at 50% 45%, rgba(43, 68, 59, 0.2) 0%, transparent 70%)",
  "toy-room": "radial-gradient(circle at 50% 45%, rgba(74, 43, 51, 0.2) 0%, transparent 70%)",
  calibration: "radial-gradient(circle at 50% 45%, rgba(36, 70, 60, 0.15) 0%, transparent 70%)",
}

export default function HomePage() {
  const [phase, setPhase] = useState<Phase>("ritual")
  const [ritualStep, setRitualStep] = useState<0 | 1>(0)
  const [activeIndex, setActiveIndex] = useState(0)
  const [dragX, setDragX] = useState(0)
  const [dragging, setDragging] = useState(false)
  const [tilt, setTilt] = useState({ x: 0, y: 0, glareX: 50, glareY: 50 })

  const touchRef = useRef({ startX: 0, startY: 0, lastX: 0, lastT: 0, velocity: 0, moved: false, isDown: false })
  const flipTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // 开屏两段式：00:00 信号搜索卡停留约 1.5s 后丝滑过渡到 00:01 门扉剪影卡
  useEffect(() => {
    const t = setTimeout(() => setRitualStep(1), 1500)
    return () => clearTimeout(t)
  }, [])

  // 键盘左右方向键切换卡片
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (phase !== "compass") return
      if (e.key === "ArrowLeft") stepTo(activeIndex - 1)
      if (e.key === "ArrowRight") stepTo(activeIndex + 1)
      if (e.key === "Enter" || e.key === " ") openActiveRoom()
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [phase, activeIndex])

  const stageSpan = 220

  const enterEden = () => {
    if (phase !== "ritual") return
    setPhase("flip")
    flipTimerRef.current = setTimeout(() => setPhase("compass"), 560)
  }

  const stepTo = (next: number) => {
    setActiveIndex(Math.min(CARD_COUNT - 1, Math.max(0, next)))
    setTilt({ x: 0, y: 0, glareX: 50, glareY: 50 })
  }

  const handleStart = (clientX: number, clientY: number) => {
    touchRef.current = {
      startX: clientX,
      startY: clientY,
      lastX: clientX,
      lastT: Date.now(),
      velocity: 0,
      moved: false,
      isDown: true,
    }
    setDragging(true)
  }

  const handleMove = (clientX: number, clientY: number, targetRect?: DOMRect) => {
    const s = touchRef.current
    if (!s.isDown) {
      // 悬停交互：计算微视差角度与高光偏移
      if (targetRect) {
        const nx = ((clientX - targetRect.left) / targetRect.width - 0.5) * 2
        const ny = ((clientY - targetRect.top) / targetRect.height - 0.5) * 2
        setTilt({
          x: Number((nx * 5).toFixed(2)),
          y: Number((ny * -4).toFixed(2)),
          glareX: Math.round(((clientX - targetRect.left) / targetRect.width) * 100),
          glareY: Math.round(((clientY - targetRect.top) / targetRect.height) * 100),
        })
      }
      return
    }

    const now = Date.now()
    const dt = Math.max(now - s.lastT, 1)
    s.velocity = (clientX - s.lastX) / dt
    s.lastX = clientX
    s.lastT = now
    if (Math.abs(clientX - s.startX) > 6 || Math.abs(clientY - s.startY) > 6) s.moved = true
    setDragX(clientX - s.startX)
  }

  const handleEnd = (clientX?: number, clientY?: number) => {
    const s = touchRef.current
    if (!s.isDown) return
    s.isDown = false
    const endX = clientX !== undefined ? clientX : s.lastX
    const endY = clientY !== undefined ? clientY : s.startY
    const dx = endX - s.startX
    const dy = endY - s.startY
    const fraction = -dx / stageSpan
    const fresh = Date.now() - s.lastT < 150

    if (dy < -60 && Math.abs(dy) > Math.abs(dx) * 1.2) {
      setDragX(0)
      setDragging(false)
      openActiveRoom()
      return
    }

    let next = activeIndex
    if (fresh && Math.abs(s.velocity) > 0.35) {
      next = activeIndex + (s.velocity < 0 ? 1 : -1)
    } else if (Math.abs(fraction) > 0.2) {
      next = activeIndex + (fraction > 0 ? 1 : -1)
    }

    setDragX(0)
    setDragging(false)
    stepTo(next)
  }

  // 移动端 Touch 事件
  const onTouchStart = (e: any) => {
    const t = e.touches?.[0]
    if (t) handleStart(t.clientX, t.clientY)
  }
  const onTouchMove = (e: any) => {
    const t = e.touches?.[0]
    if (t) handleMove(t.clientX, t.clientY)
  }
  const onTouchEnd = (e: any) => {
    const t = e.changedTouches?.[0]
    handleEnd(t?.clientX, t?.clientY)
  }

  // 桌面端 Mouse 事件
  const onMouseDown = (e: any) => {
    handleStart(e.clientX, e.clientY)
  }
  const onMouseMove = (e: any) => {
    const rect = e.currentTarget?.getBoundingClientRect?.()
    handleMove(e.clientX, e.clientY, rect)
  }
  const onMouseUp = (e: any) => {
    handleEnd(e.clientX, e.clientY)
  }

  const onWheel = (e: any) => {
    if (Math.abs(e.deltaX) > 20 || Math.abs(e.deltaY) > 20) {
      const dir = (e.deltaX || e.deltaY) > 0 ? 1 : -1
      stepTo(activeIndex + dir)
    }
  }

  const ROOM_ROUTES: Record<string, string> = {
    baink: "/pages/baink/index",
    "music-box": "/pages/music-box/index",
    archive: "/pages/archive/index",
    calibration: "/pages/calibration/index",
    story: "/pages/story/index",
    "toy-room": "/pages/toy-room/index",
  }

  const openActiveRoom = () => {
    const route = ROOM_ROUTES[active.id]
    if (route) {
      Taro.navigateTo({ url: route })
      return
    }
    Taro.showToast({ title: "房间尚未开启", icon: "none" })
  }

  const onCardTap = (index: number) => {
    if (touchRef.current.moved) return
    if (index === activeIndex) openActiveRoom()
    else stepTo(index)
  }

  const fraction = dragging ? -dragX / stageSpan : 0
  const active = SPECIMEN_CARDS[activeIndex]
  const ambientGlow = CARD_AMBIENT_GLOW[active.id] || CARD_AMBIENT_GLOW.baink

  // 高保真工业级 3D CoverFlow 变换矩阵
  const cardStyle = (index: number): CSSProperties => {
    const r = index - activeIndex - fraction
    const abs = Math.abs(r)
    const side = Math.min(abs, 1.8)
    const isCenter = abs < 0.2

    // 连续非线性旋转角与深度推进
    const tx = Number((r * 68).toFixed(2))
    const tz = Number((-110 * Math.min(abs, 2)).toFixed(1))
    const ry = Number((-Math.sign(r) * Math.min(30, Math.pow(abs, 0.85) * 26)).toFixed(2))
    const scale = Number(Math.max(0.72, 1 - 0.13 * Math.min(abs, 2)).toFixed(3))
    const opacity = abs <= 1 ? 1 - 0.42 * abs : Math.max(0, 0.58 - (abs - 1) * 0.5)

    // 居中卡片的微视差倾斜
    const tiltX = isCenter && !dragging ? tilt.x : 0
    const tiltY = isCenter && !dragging ? tilt.y : 0

    const transform = [
      `translateX(${tx}%)`,
      `translateZ(${tz}px)`,
      `rotateY(${ry + tiltX}deg)`,
      `rotateX(${tiltY}deg)`,
      `scale(${scale})`,
    ].join(" ")

    const brightness = isCenter ? 1 : Number(Math.max(0.72, 1 - 0.22 * abs).toFixed(2))
    const boxShadow = isCenter
      ? "0 34px 76px -12px rgba(29, 59, 52, 0.32), 0 12px 28px -6px rgba(0,0,0,0.18)"
      : "0 10px 28px -4px rgba(0,0,0,0.08)"

    return {
      transform,
      opacity,
      zIndex: 30 - Math.round(abs) * 10,
      cursor: "pointer",
      userSelect: "none",
      filter: `brightness(${brightness})`,
      boxShadow,
      transition: dragging
        ? "none"
        : `transform 0.52s ${SPRING}, opacity 0.52s ${SPRING}, filter 0.52s ${SPRING}, box-shadow 0.52s ${SPRING}`,
    }
  }

  return (
    <View className="eden-home">
      {phase !== "compass" ? (
        <View className={`ritual${phase === "flip" ? " ritual-flip" : ""}`}>
          <View className="ritual-top">
            <View className="ritual-top-left">
              <Text className="mono-line">// EDEN PRIVATE RESIDENCE</Text>
              <Text className="mono-line">RECONSTRUCTION RITUAL_47</Text>
            </View>
            <View className="ritual-top-right">
              <View className="signal-row">
                <View className="signal-dot" />
                <Text className="mono-line">SIGNAL FOUND</Text>
              </View>
              <Text className="mono-line">09 AUG · HOME</Text>
            </View>
          </View>

          <View className="ritual-stage">
            <View className="wing wing-left" />
            <View className="wing wing-right" />
            <View className="ritual-card" onClick={enterEden}>
              <View className="ritual-card-inner" style={{ backgroundImage: ritualBaseArt }}>
                <View className={`ritual-scan${ritualStep === 1 ? " off" : ""}`} />
                <View
                  className={`ritual-layer ritual-doors${ritualStep === 1 ? " on" : ""}`}
                  style={{ backgroundImage: ritualDoorArt }}
                />
                <View
                  className={`ritual-layer ritual-figures${ritualStep === 1 ? " on" : ""}`}
                  style={{ backgroundImage: ritualFigureArt }}
                />
                <View className={`ritual-names${ritualStep === 1 ? " on" : ""}`}>
                  <Text>BAINK / I</Text>
                  <Text>NIVAL / II</Text>
                </View>
              </View>
              <View className="ritual-card-foot">
                <Text className="ritual-foot-text">EDEN · 47</Text>
              </View>
            </View>
          </View>

          <View className="ritual-bottom">
            <View className="ritual-recall">
              <Text className="mono-line dim">MEMORY RECALLED</Text>
              <Text className="mono-line dim">VOICE BRIDGE LISTENING</Text>
              <Text className="mono-line dim">NIVAL / BAINK HOME</Text>
            </View>
            <View className="enter-btn" onClick={enterEden}>
              <Text>ENTER EDEN ↗</Text>
            </View>
          </View>
        </View>
      ) : (
        <View className="compass" onWheel={onWheel}>
          <View className="compass-ambient" style={{ background: ambientGlow }} />

          <View className="compass-head">
            <View className="head-left">
              <Text className="kicker">// EDEN DOMESTIC INDEX · PRIVATE</Text>
              <Text className="head-title">归家索引</Text>
              <Text className="head-sub">家仍记得每一道归途</Text>
              <Text className="head-note">每一张牌，通往一间房</Text>
            </View>
            <View className="head-right">
              <Text className="roman" key={active.roman}>{active.roman}</Text>
              <Text className="roman-total">/ VI</Text>
            </View>
          </View>

          <View
            className="compass-stage"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseUp}
          >
            {SPECIMEN_CARDS.map((card, i) => {
              const isCenter = i === activeIndex
              return (
                <View
                  key={card.id}
                  className="spec-card"
                  style={cardStyle(i)}
                  onClick={() => onCardTap(i)}
                >
                  <View className="spec-inner">
                    <View
                      className="spec-sheen"
                      style={
                        isCenter
                          ? {
                              background: `radial-gradient(circle at ${tilt.glareX}% ${tilt.glareY}%, rgba(255, 255, 255, 0.22) 0%, rgba(255, 255, 255, 0.04) 50%, transparent 80%)`,
                            }
                          : undefined
                      }
                    />
                    <View
                      className="spec-art"
                      style={{
                        backgroundImage: `${card.art}, ${card.artGradients}`,
                        backgroundSize: `${card.artSize}, cover`,
                      }}
                    />
                    <View className={`spec-meta meta-${card.metaTheme}`}>
                      <View className="meta-rule" />
                      {card.metaLines.map((line) => (
                        <Text key={line} className="meta-line">
                          {line}
                        </Text>
                      ))}
                    </View>
                    <View className="spec-fade" />
                    <View className="spec-text">
                      <Text className="spec-en">{card.enSub}</Text>
                      <Text className="spec-title">{card.title}</Text>
                      <Text className="spec-tags">{card.tags}</Text>
                    </View>
                  </View>
                </View>
              )
            })}
          </View>

          <View className="compass-foot">
            <View className="foot-row">
              <View className="foot-btn" onClick={() => stepTo(activeIndex - 1)}>
                <Text>‹</Text>
              </View>
              <View className="foot-mid" onClick={openActiveRoom}>
                <Text className="foot-title">{active.title}</Text>
                <Text className="foot-sub">{active.tags}</Text>
              </View>
              <View className="foot-btn" onClick={() => stepTo(activeIndex + 1)}>
                <Text>›</Text>
              </View>
            </View>
            <View className="dots">
              {SPECIMEN_CARDS.map((card, i) => (
                <View key={card.id} className={i === activeIndex ? "dot dot-on" : "dot"} onClick={() => stepTo(i)} />
              ))}
            </View>
            <Text className="foot-caption">SWIPE TO DRAW · TAP PERSON CARD TO ENTER</Text>
          </View>
        </View>
      )}
      <View className="eden-grain" />
    </View>
  )
}
