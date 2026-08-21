/**
 * Mind Capsule · EDEN 47
 * 归家索引 · 3D 标本罗盘与空间景深形变漫游系统 (In-Place Spatial Morphing Transition)
 * 
 * 核心重构：
 * 1. 彻底消灭粗暴的侧边栏滑入路由，改为 Awwwards / iOS 顶级 Shared Spatial Morphing
 * 2. 点击卡片触发 Scale + Z 轴景深穿透推进 (translateZ 140px)
 * 3. 其余卡片与罗盘景深退场，房间内容 60fps GPU 满帧流体升起
 * 4. 0 延迟、0 丢帧、无缝连贯物理回弹
 */

import { useEffect, useRef, useState } from "react"
import { View, Text } from "@tarojs/components"
import type { CSSProperties } from "react"
import { SPECIMEN_CARDS, ritualBaseArt, ritualDoorArt, ritualFigureArt } from "./cards"
import "./index.css"

// 各房间原生组件与独立状态
import { BainkView } from "../baink/BainkView"
import { useBaink } from "../baink/useBaink"
import "../baink/index.css"

import { MusicBoxView } from "../music-box/MusicBoxView"
import { useMusicBox } from "../music-box/useMusicBox"
import "../music-box/index.css"

import { ArchiveView } from "../archive/ArchiveView"
import { useArchive } from "../archive/useArchive"
import "../archive/index.css"

import { StoryView } from "../story/StoryView"
import { useStory } from "../story/useStory"
import "../story/index.css"

import { ToyRoomView } from "../toy-room/ToyRoomView"
import { useToyRoom } from "../toy-room/useToyRoom"
import "../toy-room/index.css"

import { CalibrationView } from "../calibration/CalibrationView"
import { useCalibration } from "../calibration/useCalibration"
import "../calibration/index.css"

type Phase = "ritual" | "flip" | "compass"
type RoomTransitionState = "closed" | "expanding" | "opened" | "collapsing"

const SPRING = "cubic-bezier(0.22, 1, 0.36, 1)"
const CARD_COUNT = SPECIMEN_CARDS.length

const CARD_AMBIENT_GLOW: Record<string, string> = {
  baink: "radial-gradient(circle at 50% 45%, rgba(29, 59, 52, 0.22) 0%, rgba(243, 240, 233, 0.25) 45%, transparent 70%)",
  "music-box": "radial-gradient(circle at 50% 45%, rgba(255, 94, 87, 0.22) 0%, rgba(15, 23, 42, 0.32) 50%, transparent 74%)",
  archive: "radial-gradient(circle at 50% 45%, rgba(127, 184, 199, 0.25) 0%, rgba(14, 17, 23, 0.5) 50%, transparent 70%)",
  story: "radial-gradient(circle at 50% 45%, rgba(43, 68, 59, 0.26) 0%, transparent 70%)",
  "toy-room": "radial-gradient(circle at 50% 45%, rgba(166, 58, 64, 0.26) 0%, transparent 70%)",
  calibration: "radial-gradient(circle at 50% 45%, rgba(43, 68, 59, 0.22) 0%, transparent 70%)",
}

export default function HomePage() {
  const [phase, setPhase] = useState<Phase>("ritual")
  const [ritualStep, setRitualStep] = useState<0 | 1>(0)
  const [activeIndex, setActiveIndex] = useState(0)
  const [dragX, setDragX] = useState(0)
  const [dragging, setDragging] = useState(false)
  const [tilt, setTilt] = useState({ x: 0, y: 0, glareX: 50, glareY: 50 })

  // 房间沉浸式内嵌与流体形变状态
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null)
  const [roomState, setRoomState] = useState<RoomTransitionState>("closed")

  // 房间 Hook 初始化
  const bainkProps = useBaink()
  const musicBoxProps = useMusicBox()
  const archiveProps = useArchive()
  const storyProps = useStory()
  const toyRoomProps = useToyRoom()
  const calibrationProps = useCalibration()

  const touchRef = useRef({ startX: 0, startY: 0, lastX: 0, lastT: 0, velocity: 0, moved: false, isDown: false })
  const flipTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const roomTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // 开屏两段式：00:00 信号搜索卡停留约 1.5s 后丝滑过渡到 00:01 门扉剪影卡
  useEffect(() => {
    const t = setTimeout(() => setRitualStep(1), 1500)
    return () => clearTimeout(t)
  }, [])

  // 键盘左右方向键切换卡片 / ESC 退出房间
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (roomState === "opened") {
        if (e.key === "Escape" || e.key === "Backspace") closeRoom()
        return
      }
      if (phase !== "compass") return
      if (e.key === "ArrowLeft") stepTo(activeIndex - 1)
      if (e.key === "ArrowRight") stepTo(activeIndex + 1)
      if (e.key === "Enter" || e.key === " ") openActiveRoom()
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [phase, activeIndex, roomState])

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
    if (roomState !== "closed") return
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
    if (roomState !== "closed") return
    const s = touchRef.current
    if (!s.isDown) {
      // 悬停交互：计算微视差角度与高光偏移
      if (targetRect) {
        const nx = ((clientX - targetRect.left) / targetRect.width - 0.5) * 2
        const ny = ((clientY - targetRect.top) / targetRect.height - 0.5) * 2
        setTilt({
          x: Number((nx * 6).toFixed(2)),
          y: Number((ny * -5).toFixed(2)),
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
    if (roomState !== "closed") return
    const s = touchRef.current
    if (!s.isDown) return
    s.isDown = false
    const endX = clientX !== undefined ? clientX : s.lastX
    const endY = clientY !== undefined ? clientY : s.startY
    const dx = endX - s.startX
    const dy = endY - s.startY
    const fraction = -dx / stageSpan
    const fresh = Date.now() - s.lastT < 150

    // 向上滑动卡片直接步入房间
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
    if (roomState !== "closed") return
    if (Math.abs(e.deltaX) > 20 || Math.abs(e.deltaY) > 20) {
      const dir = (e.deltaX || e.deltaY) > 0 ? 1 : -1
      stepTo(activeIndex + dir)
    }
  }

  /* ---------- 顶级 3D Spatial Morphing 步入房间 ---------- */
  const openActiveRoom = () => {
    if (roomState !== "closed") return
    const roomId = active.id
    setActiveRoomId(roomId)
    setRoomState("expanding")
    if (roomTimerRef.current) clearTimeout(roomTimerRef.current)
    roomTimerRef.current = setTimeout(() => {
      setRoomState("opened")
    }, 420)
  }

  /* ---------- 优雅折叠回退罗盘 ---------- */
  const closeRoom = () => {
    if (roomState === "closed") return
    setRoomState("collapsing")
    if (roomTimerRef.current) clearTimeout(roomTimerRef.current)
    roomTimerRef.current = setTimeout(() => {
      setRoomState("closed")
      setActiveRoomId(null)
    }, 380)
  }

  const onCardTap = (index: number) => {
    if (touchRef.current.moved) return
    if (index === activeIndex) openActiveRoom()
    else stepTo(index)
  }

  const fraction = dragging ? -dragX / stageSpan : 0
  const active = SPECIMEN_CARDS[activeIndex]
  const ambientGlow = CARD_AMBIENT_GLOW[active.id] || CARD_AMBIENT_GLOW.baink

  // 高保真工业级 3D CoverFlow 变换矩阵与 Spatial Morphing
  const cardStyle = (index: number): CSSProperties => {
    const r = index - activeIndex - fraction
    const abs = Math.abs(r)
    const isCenter = abs < 0.2

    // 基础 CoverFlow 坐标
    const tx = Number((r * 68).toFixed(2))
    const tz = Number((-110 * Math.min(abs, 2)).toFixed(1))
    const ry = Number((-Math.sign(r) * Math.min(30, Math.pow(abs, 0.85) * 26)).toFixed(2))
    const scale = Number(Math.max(0.72, 1 - 0.13 * Math.min(abs, 2)).toFixed(3))
    let opacity = abs <= 1 ? 1 - 0.42 * abs : Math.max(0, 0.58 - (abs - 1) * 0.5)

    const tiltX = isCenter && !dragging && roomState === "closed" ? tilt.x : 0
    const tiltY = isCenter && !dragging && roomState === "closed" ? tilt.y : 0

    let transform = [
      `translateX(${tx}%)`,
      `translateZ(${tz}px)`,
      `rotateY(${ry + tiltX}deg)`,
      `rotateX(${tiltY}deg)`,
      `scale(${scale})`,
    ].join(" ")

    // 处于打开/折叠状态时的景深形变
    if (roomState === "expanding" || roomState === "opened") {
      if (isCenter) {
        transform = "translateX(0%) translateZ(120px) rotateY(0deg) rotateX(0deg) scale(1.08)"
        opacity = 0
      } else {
        transform = `translateX(${tx * 1.5}%) translateZ(-200px) rotateY(${ry}deg) scale(0.6)`
        opacity = 0
      }
    } else if (roomState === "collapsing") {
      if (isCenter) {
        transform = "translateX(0%) translateZ(0px) rotateY(0deg) rotateX(0deg) scale(1)"
        opacity = 1
      }
    }

    const brightness = isCenter ? 1 : Number(Math.max(0.72, 1 - 0.22 * abs).toFixed(2))
    const boxShadow = isCenter
      ? "0 34px 76px -12px rgba(29, 59, 52, 0.38), 0 12px 28px -6px rgba(0,0,0,0.22)"
      : "0 10px 28px -4px rgba(0,0,0,0.08)"

    return {
      transform,
      opacity,
      zIndex: isCenter ? 50 : 30 - Math.round(abs) * 10,
      cursor: "pointer",
      userSelect: "none",
      filter: `brightness(${brightness})`,
      boxShadow,
      willChange: "transform, opacity",
      transition: dragging
        ? "none"
        : `transform 0.46s ${SPRING}, opacity 0.42s ${SPRING}, filter 0.42s ${SPRING}, box-shadow 0.42s ${SPRING}`,
    }
  }

  // 渲染活动房间内容 (内嵌无缝挂载)
  const renderActiveRoomView = () => {
    if (!activeRoomId || roomState === "closed") return null

    switch (activeRoomId) {
      case "baink":
        return <BainkView {...bainkProps} onBack={closeRoom} />
      case "music-box":
        return <MusicBoxView {...musicBoxProps} onBack={closeRoom} />
      case "archive":
        return <ArchiveView {...archiveProps} onBack={closeRoom} />
      case "story":
        return <StoryView {...storyProps} onBack={closeRoom} />
      case "toy-room":
        return <ToyRoomView {...toyRoomProps} onBack={closeRoom} />
      case "calibration":
        return <CalibrationView {...calibrationProps} onBack={closeRoom} />
      default:
        return null
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
                <View className={`ritual-names${ritualStep === 1 ? " on" : ""}`}>{`BAINK / I   NIVAL / II`}</View>
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
        <View className={`compass${roomState !== "closed" ? " compass-room-active" : ""}`} onWheel={onWheel}>
          <View className="compass-ambient" style={{ background: ambientGlow }} />

          <View className={`compass-head${roomState !== "closed" ? " fade-out" : ""}`}>
            <View className="head-left">
              <Text className="kicker">// EDEN DOMESTIC INDEX · PRIVATE</Text>
              <Text className="head-title">归家索引</Text>
              <Text className="head-sub">家仍记得每一道归途</Text>
              <Text className="head-note">点击或上推卡片 · 步入房间</Text>
            </View>
            <View className="head-right">
              <Text className="roman" key={active.roman}>{active.roman}</Text>
              <Text className="roman-total">/ VI</Text>
            </View>
          </View>

          <View
            className={`compass-stage${roomState !== "closed" ? " stage-morphing" : ""}`}
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
                  className={`spec-card${isCenter ? " is-center" : ""}`}
                  style={cardStyle(i)}
                  onClick={() => onCardTap(i)}
                >
                  <View className="spec-inner">
                    <View
                      className="spec-sheen"
                      style={
                        isCenter && roomState === "closed"
                          ? {
                              background: `radial-gradient(circle at ${tilt.glareX}% ${tilt.glareY}%, rgba(255, 255, 255, 0.26) 0%, rgba(255, 255, 255, 0.05) 50%, transparent 80%)`,
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
                      <Text className="meta-sub">{card.enSub}</Text>
                    </View>
                    <View className="spec-titlebox">
                      <Text className="spec-title">{card.title}</Text>
                      <Text className="spec-tags">{card.tags}</Text>
                    </View>
                  </View>
                </View>
              )
            })}
          </View>

          <View className={`compass-foot${roomState !== "closed" ? " fade-out" : ""}`}>
            <View className="foot-rule" />
            <View className="foot-row">
              <Text className="mono-line dim">COVERFLOW 3D · 6 SPECIMENS</Text>
              <Text className="mono-line dim">CLICK CARD TO ENTER</Text>
            </View>
          </View>

          {/* 60fps 硬件加速原生挂载的房间视图 */}
          {roomState !== "closed" ? (
            <View className={`eden-room-overlay ${roomState}`}>
              <View className="eden-room-viewport">{renderActiveRoomView()}</View>
            </View>
          ) : null}
        </View>
      )}
    </View>
  )
}
