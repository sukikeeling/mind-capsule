import React, { useState, useEffect, useRef } from "react"
import { SpecimenCard } from "../types"
import { ChevronLeft, ChevronRight, Compass } from "lucide-react"

interface CoverFlowIndexProps {
  cards: SpecimenCard[]
  activeIndex: number
  onChangeIndex: (index: number) => void
  onSelectCard: (card: SpecimenCard) => void
}

export const CoverFlowIndex: React.FC<CoverFlowIndexProps> = ({
  cards,
  activeIndex,
  onChangeIndex,
  onSelectCard,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [tilt, setTilt] = useState({ x: 0, y: 0, glareX: 50, glareY: 50 })
  const [touchStart, setTouchStart] = useState<number | null>(null)

  // 鼠标移动视差微倾斜
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const cardEl = e.currentTarget
    const rect = cardEl.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const centerX = rect.width / 2
    const centerY = rect.height / 2

    const rotateY = ((x - centerX) / centerX) * 12
    const rotateX = -((y - centerY) / centerY) * 12

    const glareX = (x / rect.width) * 100
    const glareY = (y / rect.height) * 100

    setTilt({ x: rotateX, y: rotateY, glareX, glareY })
  }

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0, glareX: 50, glareY: 50 })
  }

  // 键盘左右箭头支持
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        onChangeIndex((activeIndex - 1 + cards.length) % cards.length)
      } else if (e.key === "ArrowRight") {
        onChangeIndex((activeIndex + 1) % cards.length)
      } else if (e.key === "Enter" || e.key === " ") {
        onSelectCard(cards[activeIndex])
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [activeIndex, cards, onChangeIndex, onSelectCard])

  // 触控拖拽支持
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX)
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null) return
    const touchEnd = e.changedTouches[0].clientX
    const diff = touchStart - touchEnd
    if (Math.abs(diff) > 40) {
      if (diff > 0) {
        onChangeIndex((activeIndex + 1) % cards.length)
      } else {
        onChangeIndex((activeIndex - 1 + cards.length) % cards.length)
      }
    }
    setTouchStart(null)
  }

  // 鼠标滚轮横向切换
  const handleWheel = (e: React.WheelEvent) => {
    if (Math.abs(e.deltaY) > 30 || Math.abs(e.deltaX) > 30) {
      if (e.deltaY > 0 || e.deltaX > 0) {
        onChangeIndex((activeIndex + 1) % cards.length)
      } else {
        onChangeIndex((activeIndex - 1 + cards.length) % cards.length)
      }
    }
  }

  return (
    <div
      ref={containerRef}
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      }}
    >
      {/* 顶部罗盘刻度指示 */}
      <div
        style={{
          position: "absolute",
          top: "84px",
          display: "flex",
          alignItems: "center",
          gap: "12px",
          zIndex: 10,
        }}
      >
        <span
          className="font-roman"
          style={{ fontSize: "12px", color: "var(--gold)", letterSpacing: "0.2em" }}
        >
          EDEN DOMESTIC INDEX
        </span>
        <span style={{ color: "rgba(255,255,255,0.2)" }}>//</span>
        <span
          className="font-mono"
          style={{ fontSize: "11px", color: "rgba(237,234,224,0.5)" }}
        >
          0{activeIndex + 1} OF 0{cards.length}
        </span>
      </div>

      {/* 3D 卡牌舞台 */}
      <div
        className="stage-3d"
        style={{
          position: "relative",
          width: "100%",
          height: "min(540px, 66vh)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {cards.map((card, i) => {
          const offset = i - activeIndex
          const isActive = offset === 0

          // 计算 3D 空间变换
          const transX = offset * 260
          const transZ = isActive ? 120 : -Math.abs(offset) * 160
          const rotY = isActive ? tilt.y : offset * -32
          const rotX = isActive ? tilt.x : 0
          const scale = isActive ? 1 : Math.max(0.72, 1 - Math.abs(offset) * 0.14)
          const opacity = Math.abs(offset) > 2 ? 0 : Math.max(0.2, 1 - Math.abs(offset) * 0.35)
          const pointerEvents = Math.abs(offset) > 2 ? "none" : "auto"
          const zIndex = 20 - Math.abs(offset)

          return (
            <div
              key={card.id}
              onClick={() => {
                if (isActive) {
                  onSelectCard(card)
                } else {
                  onChangeIndex(i)
                }
              }}
              onMouseMove={isActive ? handleMouseMove : undefined}
              onMouseLeave={isActive ? handleMouseLeave : undefined}
              style={{
                position: "absolute",
                width: "min(310px, 78vw)",
                height: "min(460px, 60vh)",
                borderRadius: "22px",
                backgroundImage: `${card.art}, ${card.artGradients}`,
                backgroundSize: `${card.artSize}, cover`,
                backgroundPosition: "center 38%, center",
                backgroundRepeat: "no-repeat",
                cursor: isActive ? "pointer" : "pointer",
                zIndex,
                opacity,
                pointerEvents,
                transform: `translateX(${transX}px) translateZ(${transZ}px) rotateY(${rotY}deg) rotateX(${rotX}deg) scale(${scale})`,
                transition: isActive && (tilt.x !== 0 || tilt.y !== 0)
                  ? "transform 0.12s ease-out, box-shadow 0.3s ease"
                  : "transform 0.65s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.5s ease",
                transformStyle: "preserve-3d",
                boxShadow: isActive
                  ? `0 26px 65px -12px rgba(0,0,0,0.85), 0 0 45px ${card.accentColor}33, 0 0 0 1px rgba(255,255,255,0.18)`
                  : "0 12px 30px -8px rgba(0,0,0,0.65)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                padding: "24px 20px",
                color: card.metaTheme === "dark" ? "#1e2823" : "#edeae0",
              }}
            >
              {/* 高光反光层 (Specular Sheen) */}
              {isActive && (
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    borderRadius: "22px",
                    background: `radial-gradient(circle at ${tilt.glareX}% ${tilt.glareY}%, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.02) 55%, transparent 80%)`,
                    pointerEvents: "none",
                  }}
                />
              )}

              {/* 卡牌顶部标本编号与元数据 */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  position: "relative",
                  zIndex: 2,
                }}
              >
                <div>
                  <div
                    className="font-roman"
                    style={{
                      fontSize: "26px",
                      lineHeight: "1",
                      fontWeight: 600,
                      opacity: 0.9,
                    }}
                  >
                    {card.roman}
                  </div>
                  <div
                    className="font-mono"
                    style={{
                      fontSize: "10px",
                      opacity: 0.65,
                      marginTop: "3px",
                      letterSpacing: "0.1em",
                    }}
                  >
                    {card.metaLines[0]}
                  </div>
                </div>

                <div style={{ textAlign: "right" }}>
                  <span
                    className="font-mono"
                    style={{
                      fontSize: "10px",
                      letterSpacing: "0.08em",
                      opacity: 0.7,
                      background: "rgba(0,0,0,0.12)",
                      padding: "2px 6px",
                      borderRadius: "4px",
                    }}
                  >
                    {card.tags.split("·")[0].trim()}
                  </span>
                </div>
              </div>

              {/* 卡牌底部标题与开启提示 */}
              <div
                style={{
                  position: "relative",
                  zIndex: 2,
                  marginTop: "auto",
                  borderTop: "1px solid rgba(255,255,255,0.12)",
                  paddingTop: "12px",
                }}
              >
                <div
                  className="font-mono"
                  style={{
                    fontSize: "10px",
                    letterSpacing: "0.15em",
                    opacity: 0.7,
                    marginBottom: "4px",
                  }}
                >
                  {card.enSub}
                </div>
                <div
                  className="font-serif"
                  style={{
                    fontSize: "22px",
                    fontWeight: 600,
                    letterSpacing: "0.06em",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <span>{card.title}</span>
                  {isActive && (
                    <span
                      className="font-mono"
                      style={{
                        fontSize: "11px",
                        letterSpacing: "0.1em",
                        opacity: 0.85,
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      ENTER ↗
                    </span>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* 底部导航箭头与指示点 */}
      <div
        style={{
          position: "absolute",
          bottom: "40px",
          display: "flex",
          alignItems: "center",
          gap: "24px",
          zIndex: 10,
        }}
      >
        <button
          onClick={() => onChangeIndex((activeIndex - 1 + cards.length) % cards.length)}
          className="glass-pill"
          style={{
            width: "40px",
            height: "40px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--text-primary)",
          }}
          aria-label="Previous card"
        >
          <ChevronLeft size={18} />
        </button>

        {/* 序列点 */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {cards.map((c, idx) => (
            <div
              key={c.id}
              onClick={() => onChangeIndex(idx)}
              style={{
                width: activeIndex === idx ? "24px" : "6px",
                height: "6px",
                borderRadius: "3px",
                background:
                  activeIndex === idx ? "var(--gold)" : "rgba(255,255,255,0.2)",
                boxShadow:
                  activeIndex === idx ? "0 0 10px rgba(227,179,119,0.5)" : "none",
                cursor: "pointer",
                transition: "all 0.35s ease",
              }}
            />
          ))}
        </div>

        <button
          onClick={() => onChangeIndex((activeIndex + 1) % cards.length)}
          className="glass-pill"
          style={{
            width: "40px",
            height: "40px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--text-primary)",
          }}
          aria-label="Next card"
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  )
}
