import React, { useState } from "react"
import { Bell, Heart, Sparkles, Smile } from "lucide-react"

export const ToyRoom: React.FC = () => {
  const [purrCount, setPurrCount] = useState(() => {
    return Number(localStorage.getItem("eden_kitty_purr_count") || "47")
  })
  const [bubbles, setBubbles] = useState<Array<{ id: number; text: string; x: number; y: number }>>([])
  const [bellRinging, setBellRinging] = useState(false)
  const [kittyMood, setKittyMood] = useState("正在桥头舒服地晒着星光")

  // 点击猫咪互动
  const handlePetKitty = (e: React.MouseEvent) => {
    const newCount = purrCount + 1
    setPurrCount(newCount)
    localStorage.setItem("eden_kitty_purr_count", newCount.toString())

    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const moods = ["呼噜噜~", "喵呜❤", "尾巴轻轻蹭你", "求抱抱", "舒服地眯起眼"]
    const text = moods[Math.floor(Math.random() * moods.length)]
    setKittyMood(text)

    const bubble = {
      id: Date.now() + Math.random(),
      text,
      x: x + (Math.random() * 20 - 10),
      y: y - 20,
    }

    setBubbles((prev) => [...prev, bubble])
    setTimeout(() => {
      setBubbles((prev) => prev.filter((b) => b.id !== bubble.id))
    }, 1800)
  }

  // 敲响桥头铃铛
  const handleRingBell = () => {
    setBellRinging(true)
    setTimeout(() => setBellRinging(false), 900)
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "space-between",
        height: "100%",
        maxWidth: "760px",
        margin: "0 auto",
        width: "100%",
        position: "relative",
      }}
    >
      {/* 顶部猫舍状态栏 */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          width: "100%",
          padding: "16px 20px",
          background: "rgba(18, 22, 28, 0.6)",
          backdropFilter: "blur(12px)",
          borderRadius: "16px",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <Heart size={18} color="#e88b96" />
          <div>
            <div
              className="font-serif"
              style={{ fontSize: "15px", fontWeight: 600, color: "#edeae0" }}
            >
              浮桥猫舍 · 伴侣治愈工坊
            </div>
            <div
              className="font-mono"
              style={{ fontSize: "10px", color: "var(--text-muted)" }}
            >
              KITTY BRIDGE // PURR ENGINE READY
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {/* 桥头铜铃 */}
          <button
            onClick={handleRingBell}
            className="glass-pill"
            style={{
              padding: "6px 12px",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              color: "var(--gold)",
            }}
          >
            <Bell
              size={14}
              style={{
                transform: bellRinging ? "rotate(25deg)" : "none",
                transition: "transform 0.15s ease",
              }}
            />
            <span className="font-serif" style={{ fontSize: "11px" }}>
              轻摇铜铃
            </span>
          </button>

          <div
            className="font-mono"
            style={{
              padding: "4px 10px",
              borderRadius: "8px",
              background: "rgba(232, 139, 150, 0.15)",
              color: "#e88b96",
              fontSize: "11px",
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            <span>抚摸计数:</span>
            <strong>{purrCount}</strong>
          </div>
        </div>
      </div>

      {/* 浮桥与猫咪核心画布 */}
      <div
        onClick={handlePetKitty}
        style={{
          position: "relative",
          width: "min(360px, 85vw)",
          height: "min(360px, 50vh)",
          margin: "16px 0",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* 动态飘浮气泡 */}
        {bubbles.map((b) => (
          <div
            key={b.id}
            className="font-serif"
            style={{
              position: "absolute",
              left: b.x,
              top: b.y,
              transform: "translate(-50%, -100%)",
              background: "rgba(232, 139, 150, 0.9)",
              color: "#fff",
              padding: "4px 10px",
              borderRadius: "12px",
              fontSize: "12px",
              pointerEvents: "none",
              animation: "floatGentle 1.6s ease-out forwards",
              boxShadow: "0 4px 12px rgba(232,139,150,0.5)",
              zIndex: 30,
              whiteSpace: "nowrap",
            }}
          >
            {b.text}
          </div>
        ))}

        {/* 矢量浮桥与猫咪 */}
        <svg
          viewBox="0 0 320 320"
          style={{
            width: "100%",
            height: "100%",
            filter: "drop-shadow(0 15px 35px rgba(0,0,0,0.6))",
          }}
        >
          <defs>
            {/* 桥下水波倒影 */}
            <linearGradient id="bridgeWater" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#4a2b33" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#241620" stopOpacity="0.8" />
            </linearGradient>
          </defs>

          {/* 桥下幽微水纹波光 */}
          <path
            d="M 20 250 Q 100 238 160 250 T 300 250"
            fill="none"
            stroke="#e88b96"
            strokeWidth="1.2"
            opacity="0.35"
            strokeDasharray="4 6"
          />
          <path
            d="M 40 270 Q 120 258 180 270 T 280 270"
            fill="none"
            stroke="#edeae0"
            strokeWidth="1"
            opacity="0.25"
            strokeDasharray="3 5"
          />

          {/* 拱桥主拱梁 */}
          <path
            d="M 30 220 Q 160 140 290 220"
            fill="none"
            stroke="#edeae0"
            strokeWidth="6"
            strokeLinecap="round"
            opacity="0.9"
          />
          {/* 桥栏杆 */}
          <path
            d="M 40 206 Q 160 126 280 206"
            fill="none"
            stroke="#edeae0"
            strokeWidth="1.8"
            opacity="0.75"
          />
          {/* 桥墩竖柱 */}
          <line x1="70" y1="190" x2="70" y2="206" stroke="#edeae0" strokeWidth="1.5" />
          <line x1="110" y1="172" x2="110" y2="190" stroke="#edeae0" strokeWidth="1.5" />
          <line x1="160" y1="160" x2="160" y2="178" stroke="#edeae0" strokeWidth="1.5" />
          <line x1="210" y1="172" x2="210" y2="190" stroke="#edeae0" strokeWidth="1.5" />
          <line x1="250" y1="190" x2="250" y2="206" stroke="#edeae0" strokeWidth="1.5" />

          {/* 趴在桥中央打呼噜的可爱猫咪 */}
          <g transform="translate(130, 118)">
            {/* 柔软身躯 */}
            <ellipse
              cx="32"
              cy="34"
              rx="26"
              ry="18"
              fill="#e3b377"
              className="animate-pulse-glow"
            />
            {/* 猫头 */}
            <circle cx="54" cy="24" r="14" fill="#e3b377" />
            {/* 耳朵 */}
            <polygon points="46,14 42,4 52,11" fill="#e88b96" />
            <polygon points="56,11 64,4 62,14" fill="#e88b96" />
            {/* 闭上的享受双眼 */}
            <path
              d="M 48 24 Q 51 27 54 24"
              fill="none"
              stroke="#241620"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <path
              d="M 57 24 Q 60 27 63 24"
              fill="none"
              stroke="#241620"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            {/* 萌萌的小胡须 */}
            <line x1="62" y1="26" x2="70" y2="24" stroke="#fff" strokeWidth="1" opacity="0.8" />
            <line x1="62" y1="28" x2="69" y2="30" stroke="#fff" strokeWidth="1" opacity="0.8" />

            {/* 摇晃的猫尾巴 */}
            <path
              d="M 10 36 C -4 30 -4 14 6 10"
              fill="none"
              stroke="#e3b377"
              strokeWidth="5"
              strokeLinecap="round"
              style={{
                transformOrigin: "10px 36px",
                animation: "floatGentle 2.5s ease-in-out infinite",
              }}
            />
          </g>
        </svg>
      </div>

      {/* 底部互动指南卡 */}
      <div
        className="glass-card"
        style={{
          width: "100%",
          padding: "18px 24px",
          borderRadius: "16px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          border: "1px solid rgba(232, 139, 150, 0.25)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <Smile size={16} color="#e88b96" />
          <span className="font-serif" style={{ fontSize: "13px", color: "rgba(237,234,224,0.9)" }}>
            状态: <strong style={{ color: "#e88b96" }}>{kittyMood}</strong>
          </span>
        </div>

        <span
          className="font-mono"
          style={{ fontSize: "11px", color: "var(--gold)" }}
        >
          ✦ CLICK KITTY TO PET ✦
        </span>
      </div>
    </div>
  )
}
