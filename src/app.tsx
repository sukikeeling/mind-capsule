import React, { useState, useEffect } from "react"
import { SPECIMEN_CARDS } from "./data/specimenCards"
import { PRESET_CAPSULES } from "./data/presetCapsules"
import { SpecimenCard, MindCapsuleItem, CalibrationSettings } from "./types"
import { AmbientGlow } from "./components/AmbientGlow"
import { RitualEntrance } from "./components/RitualEntrance"
import { CoverFlowIndex } from "./components/CoverFlowIndex"
import { CapsuleModal } from "./components/CapsuleModal"

// 房间组件
import { BainkRoom } from "./components/rooms/BainkRoom"
import { MusicBoxRoom } from "./components/rooms/MusicBoxRoom"
import { ArchiveRoom } from "./components/rooms/ArchiveRoom"
import { StoryRoom } from "./components/rooms/StoryRoom"
import { ToyRoom } from "./components/rooms/ToyRoom"
import { CalibrationRoom } from "./components/rooms/CalibrationRoom"

import {
  Sparkles,
  ArrowLeft,
  Sliders,
  Layers,
  Github,
  Compass,
  Radio,
} from "lucide-react"
import "./app.css"

const DEFAULT_SETTINGS: CalibrationSettings = {
  fontSize: 14,
  density: "standard",
  motionLevel: "full",
  grainLevel: "subtle",
  starfield: true,
  streamTyping: true,
}

export default function App() {
  const [phase, setPhase] = useState<"ritual" | "eden">("ritual")
  const [activeIndex, setActiveIndex] = useState(0)
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null)
  const [isCapsuleModalOpen, setIsCapsuleModalOpen] = useState(false)

  // 思维胶囊数据与本地存储
  const [capsules, setCapsules] = useState<MindCapsuleItem[]>(() => {
    const saved = localStorage.getItem("eden_mind_capsules")
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch (e) {
        return PRESET_CAPSULES
      }
    }
    return PRESET_CAPSULES
  })

  // 全屋校准设置与本地存储
  const [settings, setSettings] = useState<CalibrationSettings>(() => {
    const saved = localStorage.getItem("eden_house_settings")
    if (saved) {
      try {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) }
      } catch (e) {
        return DEFAULT_SETTINGS
      }
    }
    return DEFAULT_SETTINGS
  })

  // 保存胶囊到本地
  const handleAddCapsule = (newCap: MindCapsuleItem) => {
    const updated = [newCap, ...capsules]
    setCapsules(updated)
    localStorage.setItem("eden_mind_capsules", JSON.stringify(updated))
  }

  // 启封胶囊
  const handleOpenCapsule = (id: string) => {
    const updated = capsules.map((c) => (c.id === id ? { ...c, isOpened: true } : c))
    setCapsules(updated)
    localStorage.setItem("eden_mind_capsules", JSON.stringify(updated))
  }

  // 更新校准设置
  const handleUpdateSettings = (newPartial: Partial<CalibrationSettings>) => {
    const updated = { ...settings, ...newPartial }
    setSettings(updated)
    localStorage.setItem("eden_house_settings", JSON.stringify(updated))
  }

  // ESC 键返回罗盘
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (isCapsuleModalOpen) {
          setIsCapsuleModalOpen(false)
        } else if (activeRoomId) {
          setActiveRoomId(null)
        }
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [activeRoomId, isCapsuleModalOpen])

  const currentCard = SPECIMEN_CARDS[activeIndex]
  const currentAccent = currentCard?.accentColor || "#e3b377"

  return (
    <div
      style={{
        position: "relative",
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
        backgroundColor: "var(--bg-obsidian)",
        color: "var(--text-primary)",
      }}
    >
      {/* 胶片噪点 */}
      <div className={`film-grain grain-${settings.grainLevel}`} />

      {/* 宇宙星云与光晕 */}
      <AmbientGlow
        accentColor={currentAccent}
        enableStarfield={settings.starfield}
      />

      {/* 玄关与重构仪式 */}
      {phase === "ritual" ? (
        <RitualEntrance onEnter={() => setPhase("eden")} />
      ) : (
        <div
          style={{
            position: "relative",
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            zIndex: 10,
          }}
        >
          {/* 顶奢级全局顶部导航栏 */}
          <header
            style={{
              height: "68px",
              padding: "0 28px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
              background: "rgba(10, 12, 15, 0.65)",
              backdropFilter: "blur(18px)",
              WebkitBackdropFilter: "blur(18px)",
              zIndex: 30,
            }}
          >
            {/* 左侧：返回大厅或品牌标志 */}
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              {activeRoomId ? (
                <button
                  onClick={() => setActiveRoomId(null)}
                  className="glass-pill"
                  style={{
                    padding: "8px 16px",
                    fontSize: "12px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    color: "var(--gold)",
                  }}
                >
                  <ArrowLeft size={14} />
                  <span className="font-roman">RETURN TO INDEX (ESC)</span>
                </button>
              ) : (
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "50%",
                      background: "linear-gradient(135deg, #1b231e, #0d1210)",
                      border: "1px solid var(--gold)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: "0 0 15px rgba(227,179,119,0.3)",
                    }}
                  >
                    <Compass size={16} color="var(--gold)" />
                  </div>
                  <div>
                    <h1
                      className="font-roman"
                      style={{
                        fontSize: "16px",
                        letterSpacing: "0.2em",
                        lineHeight: "1.1",
                        fontWeight: 600,
                      }}
                    >
                      MIND CAPSULE
                    </h1>
                    <div
                      className="font-mono"
                      style={{
                        fontSize: "9px",
                        color: "var(--text-muted)",
                        letterSpacing: "0.15em",
                      }}
                    >
                      EDEN · 47 // SCI-FI ROMANTICISM
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 右侧快捷工具栏 */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              {/* 心灵胶囊时光保险库 (核心按钮) */}
              <button
                onClick={() => setIsCapsuleModalOpen(true)}
                className="glass-pill"
                style={{
                  padding: "8px 16px",
                  fontSize: "12px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  color: "#111",
                  background: "var(--gold)",
                  fontWeight: 600,
                  boxShadow: "0 0 25px rgba(227, 179, 119, 0.4)",
                  border: "none",
                }}
              >
                <Sparkles size={14} />
                <span className="font-serif">思维胶囊库</span>
                <span
                  className="font-mono"
                  style={{
                    fontSize: "10px",
                    background: "rgba(0,0,0,0.25)",
                    color: "#fff",
                    padding: "1px 6px",
                    borderRadius: "10px",
                  }}
                >
                  {capsules.length}
                </span>
              </button>

              {/* 全屋校准快捷方式 */}
              <button
                onClick={() => {
                  setActiveIndex(5) // 第 6 张是 calibration
                  setActiveRoomId("calibration")
                }}
                className="glass-pill"
                style={{
                  width: "38px",
                  height: "38px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--text-primary)",
                }}
                title="全屋校准设置"
              >
                <Sliders size={16} />
              </button>

              {/* GitHub 仓库链接 */}
              <a
                href="https://github.com/sukikeeling/mind-capsule"
                target="_blank"
                rel="noreferrer"
                className="glass-pill"
                style={{
                  width: "38px",
                  height: "38px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--text-primary)",
                  textDecoration: "none",
                }}
                title="GitHub 源码"
              >
                <Github size={16} />
              </a>
            </div>
          </header>

          {/* 主体视窗：3D CoverFlow 罗盘 or 房间展开内容 */}
          <main
            style={{
              flex: 1,
              position: "relative",
              overflow: "hidden",
              padding: activeRoomId ? "24px 20px" : "0",
            }}
          >
            {activeRoomId ? (
              /* 房间展开视图 */
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  animation: "floatGentle 0.4s ease-out",
                }}
              >
                {activeRoomId === "baink" && (
                  <BainkRoom fontSize={settings.fontSize} />
                )}
                {activeRoomId === "music-box" && <MusicBoxRoom />}
                {activeRoomId === "archive" && <ArchiveRoom />}
                {activeRoomId === "story" && <StoryRoom />}
                {activeRoomId === "toy-room" && <ToyRoom />}
                {activeRoomId === "calibration" && (
                  <CalibrationRoom
                    settings={settings}
                    onUpdateSettings={handleUpdateSettings}
                  />
                )}
              </div>
            ) : (
              /* 3D CoverFlow 罗盘 */
              <CoverFlowIndex
                cards={SPECIMEN_CARDS}
                activeIndex={activeIndex}
                onChangeIndex={setActiveIndex}
                onSelectCard={(card) => setActiveRoomId(card.id)}
              />
            )}
          </main>
        </div>
      )}

      {/* 思维胶囊时光保险库弹窗 */}
      <CapsuleModal
        isOpen={isCapsuleModalOpen}
        onClose={() => setIsCapsuleModalOpen(false)}
        capsules={capsules}
        onAddCapsule={handleAddCapsule}
        onOpenCapsule={handleOpenCapsule}
      />
    </div>
  )
}
