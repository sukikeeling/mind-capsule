import React, { useState, useEffect, useRef } from "react"
import { PLAYLIST } from "../../data/playlist"
import { Play, Pause, SkipForward, SkipBack, Disc, Volume2, Sun, Moon } from "lucide-react"

export const MusicBoxRoom: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(true)
  const [trackIndex, setTrackIndex] = useState(0)
  const [mode, setMode] = useState<"night" | "ivory">("night")
  const [lyricIndex, setLyricIndex] = useState(0)

  const currentTrack = PLAYLIST[trackIndex]
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  // 歌词定时滚动
  useEffect(() => {
    if (!isPlaying) return
    const interval = setInterval(() => {
      if (currentTrack.lyrics && currentTrack.lyrics.length > 0) {
        setLyricIndex((prev) => (prev + 1) % currentTrack.lyrics!.length)
      }
    }, 4500)
    return () => clearInterval(interval)
  }, [isPlaying, currentTrack])

  // Canvas 实时音频频谱动画
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let animId: number
    const barCount = 20
    const bars = Array.from({ length: barCount }, () => ({
      height: 10,
      target: 20,
      speed: 0.1,
    }))

    const render = () => {
      const width = (canvas.width = canvas.offsetWidth)
      const height = (canvas.height = canvas.offsetHeight)
      ctx.clearRect(0, 0, width, height)

      const barWidth = width / barCount - 4

      for (let i = 0; i < barCount; i++) {
        const b = bars[i]
        if (isPlaying) {
          if (Math.abs(b.height - b.target) < 1) {
            b.target = Math.random() * (height * 0.75) + 8
          }
          b.height += (b.target - b.height) * 0.12
        } else {
          b.height += (4 - b.height) * 0.1
        }

        const x = i * (barWidth + 4)
        const y = height - b.height

        const gradient = ctx.createLinearGradient(0, height, 0, 0)
        if (mode === "night") {
          gradient.addColorStop(0, "rgba(255, 94, 87, 0.4)")
          gradient.addColorStop(1, "rgba(227, 179, 119, 0.9)")
        } else {
          gradient.addColorStop(0, "rgba(43, 68, 59, 0.3)")
          gradient.addColorStop(1, "rgba(43, 68, 59, 0.8)")
        }

        ctx.fillStyle = gradient
        ctx.beginPath()
        ctx.roundRect(x, y, barWidth, b.height, [3, 3, 0, 0])
        ctx.fill()
      }

      animId = requestAnimationFrame(render)
    }

    render()
    return () => cancelAnimationFrame(animId)
  }, [isPlaying, mode])

  const nextTrack = () => {
    setTrackIndex((prev) => (prev + 1) % PLAYLIST.length)
    setLyricIndex(0)
  }

  const prevTrack = () => {
    setTrackIndex((prev) => (prev - 1 + PLAYLIST.length) % PLAYLIST.length)
    setLyricIndex(0)
  }

  const isNight = mode === "night"

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "space-between",
        height: "100%",
        maxWidth: "780px",
        margin: "0 auto",
        width: "100%",
        padding: "16px 0",
        transition: "all 0.5s ease",
      }}
    >
      {/* 顶部白昼/星夜切换与唱机状态 */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          width: "100%",
          padding: "12px 20px",
          background: isNight ? "rgba(18, 22, 28, 0.5)" : "rgba(244, 239, 230, 0.7)",
          borderRadius: "14px",
          color: isNight ? "#edeae0" : "#24322a",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Disc
            size={16}
            color={isNight ? "#ff5e57" : "#2b443b"}
            className={isPlaying ? "animate-spin-slow" : ""}
          />
          <span className="font-mono" style={{ fontSize: "11px", letterSpacing: "0.1em" }}>
            33⅓ RPM // TURNTABLE TIDAL
          </span>
        </div>

        <button
          onClick={() => setMode(isNight ? "ivory" : "night")}
          className="glass-pill"
          style={{
            padding: "6px 12px",
            fontSize: "11px",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            color: isNight ? "var(--gold)" : "#2b443b",
            background: isNight ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)",
          }}
        >
          {isNight ? <Moon size={13} /> : <Sun size={13} />}
          <span className="font-roman">{isNight ? "NIGHT NEBULA" : "IVORY DAY"}</span>
        </button>
      </div>

      {/* 黑胶旋转唱盘与音臂 */}
      <div
        style={{
          position: "relative",
          width: "min(280px, 60vw)",
          height: "min(280px, 60vw)",
          margin: "24px 0",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* 黑胶底座外圈 */}
        <div
          style={{
            position: "absolute",
            inset: -12,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(255,255,255,0.05) 0%, transparent 70%)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        />

        {/* 旋转黑胶唱片盘体 */}
        <div
          style={{
            width: "100%",
            height: "100%",
            borderRadius: "50%",
            background:
              "radial-gradient(circle, #2a2d34 0%, #15181e 30%, #0d0f12 60%, #171920 100%)",
            boxShadow:
              "0 20px 50px -10px rgba(0,0,0,0.8), inset 0 0 0 4px #0a0c0e, inset 0 0 0 8px rgba(255,255,255,0.03)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            animation: isPlaying ? "spinSlow 12s linear infinite" : "none",
            position: "relative",
          }}
        >
          {/* 同心沟槽 */}
          <div
            style={{
              position: "absolute",
              inset: "15%",
              borderRadius: "50%",
              border: "1px dashed rgba(255,255,255,0.06)",
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: "30%",
              borderRadius: "50%",
              border: "1px dashed rgba(255,255,255,0.06)",
            }}
          />

          {/* 唱片中心红签 */}
          <div
            style={{
              width: "36%",
              height: "36%",
              borderRadius: "50%",
              background: "linear-gradient(135deg, #a63a40 0%, #681d24 100%)",
              border: "2px solid #e3b377",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              padding: "4px",
              boxShadow: "0 0 15px rgba(0,0,0,0.5)",
            }}
          >
            <span
              className="font-roman"
              style={{ fontSize: "9px", letterSpacing: "0.15em", color: "#e3b377" }}
            >
              EDEN_47
            </span>
            <div
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                background: "#0a0c0f",
                margin: "3px 0",
              }}
            />
            <span className="font-mono" style={{ fontSize: "8px", opacity: 0.8 }}>
              STEREO
            </span>
          </div>
        </div>

        {/* 拾音唱针装置 */}
        <div
          style={{
            position: "absolute",
            top: "-24px",
            right: "-20px",
            width: "80px",
            height: "120px",
            transformOrigin: "top right",
            transform: isPlaying ? "rotate(18deg)" : "rotate(0deg)",
            transition: "transform 0.6s cubic-bezier(0.22, 1, 0.36, 1)",
            pointerEvents: "none",
          }}
        >
          {/* 唱针枢轴 */}
          <div
            style={{
              width: "16px",
              height: "16px",
              borderRadius: "50%",
              background: "#e3b377",
              boxShadow: "0 0 10px rgba(227,179,119,0.5)",
              position: "absolute",
              right: 0,
              top: 0,
            }}
          />
          {/* 金属针臂 */}
          <div
            style={{
              width: "3px",
              height: "100px",
              background: "linear-gradient(to bottom, #e3b377, #999)",
              position: "absolute",
              right: "6px",
              top: "14px",
              transformOrigin: "top",
              transform: "rotate(16deg)",
            }}
          />
        </div>
      </div>

      {/* 实时波形频谱 Canvas */}
      <div style={{ width: "100%", height: "45px", margin: "8px 0" }}>
        <canvas ref={canvasRef} style={{ width: "100%", height: "100%" }} />
      </div>

      {/* 歌曲信息与歌词 */}
      <div style={{ textAlign: "center", margin: "8px 0", width: "100%" }}>
        <h3
          className="font-serif"
          style={{
            fontSize: "20px",
            fontWeight: 600,
            color: isNight ? "#edeae0" : "#1a2520",
            marginBottom: "4px",
          }}
        >
          {currentTrack.title}
        </h3>
        <p
          className="font-mono"
          style={{
            fontSize: "12px",
            color: isNight ? "var(--gold)" : "#527365",
            marginBottom: "12px",
          }}
        >
          {currentTrack.artist} // {currentTrack.note}
        </p>

        {/* 动态滚动的歌词展示 */}
        <div
          className="font-serif"
          style={{
            minHeight: "44px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "14px",
            color: isNight ? "rgba(237,234,224,0.7)" : "#3a4a40",
            fontStyle: "italic",
            padding: "0 20px",
          }}
        >
          “ {currentTrack.lyrics?.[lyricIndex] || "♪ 旋律在黑夜深处悠然流淌 ♪"} ”
        </div>
      </div>

      {/* 底部播放控制面板 */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "24px",
          marginTop: "12px",
        }}
      >
        <button
          onClick={prevTrack}
          className="glass-pill"
          style={{
            width: "42px",
            height: "42px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: isNight ? "#edeae0" : "#24322a",
          }}
        >
          <SkipBack size={18} />
        </button>

        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="glass-pill"
          style={{
            width: "56px",
            height: "56px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: isPlaying ? "#111" : "var(--gold)",
            background: isPlaying ? "var(--gold)" : "rgba(255,255,255,0.08)",
            boxShadow: isPlaying ? "0 0 25px rgba(227,179,119,0.4)" : "none",
          }}
        >
          {isPlaying ? <Pause size={22} /> : <Play size={22} style={{ marginLeft: "2px" }} />}
        </button>

        <button
          onClick={nextTrack}
          className="glass-pill"
          style={{
            width: "42px",
            height: "42px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: isNight ? "#edeae0" : "#24322a",
          }}
        >
          <SkipForward size={18} />
        </button>
      </div>
    </div>
  )
}
