import React, { useEffect, useState } from "react"
import { Sparkles, Compass, Radio } from "lucide-react"

interface RitualEntranceProps {
  onEnter: () => void
}

export const RitualEntrance: React.FC<RitualEntranceProps> = ({ onEnter }) => {
  const [step, setStep] = useState<0 | 1>(0)
  const [flipping, setFlipping] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setStep(1)
    }, 1200)
    return () => clearTimeout(timer)
  }, [])

  const handleEnter = () => {
    setFlipping(true)
    setTimeout(() => {
      onEnter()
    }, 700)
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "#080a0d",
        perspective: "1200px",
        transition: "opacity 0.6s ease",
      }}
    >
      {/* 仪式卡牌容器 */}
      <div
        onClick={step === 1 ? handleEnter : undefined}
        style={{
          width: "min(340px, 86vw)",
          height: "min(520px, 78vh)",
          borderRadius: "20px",
          background: "linear-gradient(175deg, #141b18 0%, #0d1210 100%)",
          border: "1px solid rgba(227, 179, 119, 0.25)",
          boxShadow: "0 25px 60px -15px rgba(0,0,0,0.8), 0 0 40px rgba(227, 179, 119, 0.1)",
          position: "relative",
          overflow: "hidden",
          cursor: step === 1 ? "pointer" : "default",
          transform: flipping
            ? "rotateY(96deg) scale(0.85) translateZ(-100px)"
            : "rotateY(0deg) scale(1)",
          transition: "transform 0.75s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.4s ease",
          display: "flex",
          flexDirection: "column",
          padding: "24px",
        }}
      >
        {/* 顶部元数据 */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
            paddingBottom: "12px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Radio size={14} color="#e3b377" className="animate-pulse" />
            <span
              className="font-mono"
              style={{ fontSize: "11px", letterSpacing: "0.15em", color: "#e3b377" }}
            >
              {step === 0 ? "SEARCHING..." : "SIGNAL FOUND"}
            </span>
          </div>
          <span
            className="font-mono"
            style={{ fontSize: "11px", color: "rgba(237, 234, 224, 0.4)" }}
          >
            00:47 // LAT_0
          </span>
        </div>

        {/* 卡牌核心插画区 */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
            margin: "20px 0",
          }}
        >
          {/* 扫描线动画 */}
          <div
            style={{
              position: "absolute",
              width: "100%",
              height: "2px",
              background:
                "linear-gradient(90deg, transparent, rgba(227, 179, 119, 0.7), transparent)",
              boxShadow: "0 0 10px rgba(227, 179, 119, 0.8)",
              animation: "scanline 3s ease-in-out infinite",
              pointerEvents: "none",
            }}
          />

          {/* 门扉与双人剪影矢量 */}
          <svg
            viewBox="0 0 240 280"
            style={{
              width: "82%",
              height: "auto",
              filter: "drop-shadow(0 10px 20px rgba(0,0,0,0.5))",
            }}
          >
            {/* 建筑与双门 */}
            <rect
              x="60"
              y="50"
              width="58"
              height="180"
              fill="#18231e"
              stroke="rgba(227, 179, 119, 0.3)"
              strokeWidth="1.2"
              rx="2"
            />
            <rect
              x="122"
              y="50"
              width="58"
              height="180"
              fill="#131b17"
              stroke="rgba(227, 179, 119, 0.3)"
              strokeWidth="1.2"
              rx="2"
            />

            {/* 门楣星轨圆弧 */}
            <path
              d="M40 230 C40 120 200 120 200 230"
              fill="none"
              stroke="rgba(227, 179, 119, 0.2)"
              strokeWidth="1"
              strokeDasharray="3 3"
            />

            {/* 双人剪影 (阿宁 & 小萱 · 宇宙浪漫刻印) */}
            <g
              style={{
                opacity: step === 1 ? 1 : 0.2,
                transition: "opacity 1.2s ease",
              }}
            >
              {/* 人物 I */}
              <circle cx="89" cy="120" r="10" fill="#759b8b" />
              <path d="M89 132 L78 200 L100 200 Z" fill="#759b8b" opacity="0.9" />

              {/* 人物 II */}
              <circle cx="151" cy="120" r="10" fill="#e3b377" />
              <path d="M151 132 L140 200 L162 200 Z" fill="#e3b377" opacity="0.9" />

              {/* 指尖星辉微光 */}
              <circle
                cx="120"
                cy="165"
                r="3"
                fill="#ffffff"
                className="animate-pulse"
              />
            </g>
          </svg>

          {/* 铭牌与编号 */}
          <div
            style={{
              marginTop: "8px",
              textAlign: "center",
            }}
          >
            <div
              className="font-roman"
              style={{
                fontSize: "14px",
                letterSpacing: "0.25em",
                color: "#edeae0",
                marginBottom: "4px",
              }}
            >
              EDEN · 47
            </div>
            <div
              className="font-mono"
              style={{
                fontSize: "11px",
                color: "rgba(227, 179, 119, 0.7)",
                letterSpacing: "0.1em",
              }}
            >
              {step === 0 ? "CALIBRATING ORBIT..." : "RECONSTRUCTION RITUAL"}
            </div>
          </div>
        </div>

        {/* 底部交互按钮 */}
        <div style={{ textAlign: "center", marginTop: "auto" }}>
          {step === 1 ? (
            <button
              onClick={handleEnter}
              className="glass-pill font-roman"
              style={{
                width: "100%",
                padding: "12px 0",
                fontSize: "13px",
                letterSpacing: "0.2em",
                color: "#e3b377",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                boxShadow: "0 0 25px rgba(227, 179, 119, 0.25)",
              }}
            >
              <span>ENTER EDEN</span>
              <Sparkles size={14} />
            </button>
          ) : (
            <div
              className="font-mono"
              style={{
                fontSize: "11px",
                color: "rgba(237, 234, 224, 0.4)",
                padding: "10px 0",
              }}
            >
              SYNCHRONIZING QUANTUM PHASE...
            </div>
          )}
        </div>
      </div>

      {/* 底部诗意提示 */}
      <div
        className="font-serif"
        style={{
          marginTop: "24px",
          fontSize: "12px",
          color: "rgba(237, 234, 224, 0.45)",
          letterSpacing: "0.15em",
          display: "flex",
          alignItems: "center",
          gap: "6px",
        }}
      >
        <Compass size={13} color="#759b8b" />
        <span>伊甸私人居所 · 档案科幻浪漫主义数字伴侣空间</span>
      </div>
    </div>
  )
}
