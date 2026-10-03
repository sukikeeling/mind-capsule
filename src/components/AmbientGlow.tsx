import React, { useEffect, useRef } from "react"

interface AmbientGlowProps {
  accentColor: string
  enableStarfield?: boolean
}

export const AmbientGlow: React.FC<AmbientGlowProps> = ({
  accentColor,
  enableStarfield = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    if (!enableStarfield) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let animationFrameId: number
    let width = (canvas.width = window.innerWidth)
    let height = (canvas.height = window.innerHeight)

    const handleResize = () => {
      if (!canvas) return
      width = canvas.width = window.innerWidth
      height = canvas.height = window.innerHeight
    }
    window.addEventListener("resize", handleResize)

    // 创建星空微光粒子
    const starCount = 55
    const stars = Array.from({ length: starCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 1.6 + 0.4,
      alpha: Math.random() * 0.7 + 0.2,
      speed: Math.random() * 0.15 + 0.05,
      direction: Math.random() * Math.PI * 2,
    }))

    const render = () => {
      ctx.clearRect(0, 0, width, height)
      for (const star of stars) {
        star.y -= star.speed
        if (star.y < 0) {
          star.y = height
          star.x = Math.random() * width
        }
        ctx.fillStyle = `rgba(237, 234, 224, ${star.alpha})`
        ctx.beginPath()
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2)
        ctx.fill()
      }
      animationFrameId = requestAnimationFrame(render)
    }

    render()

    return () => {
      window.removeEventListener("resize", handleResize)
      cancelAnimationFrame(animationFrameId)
    }
  }, [enableStarfield])

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        zIndex: 0,
        overflow: "hidden",
        transition: "background 1.2s cubic-bezier(0.22, 1, 0.36, 1)",
      }}
    >
      {/* 渐变流光光晕 */}
      <div
        style={{
          position: "absolute",
          top: "40%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "90vw",
          height: "80vh",
          maxWidth: "1100px",
          maxHeight: "900px",
          background: `radial-gradient(circle at 50% 50%, ${accentColor}33 0%, ${accentColor}11 45%, transparent 75%)`,
          filter: "blur(60px)",
          opacity: 0.85,
          transition: "background 1.5s ease, filter 1.5s ease",
        }}
      />

      {/* 辅助紫金星云底色 */}
      <div
        style={{
          position: "absolute",
          top: "10%",
          right: "15%",
          width: "450px",
          height: "450px",
          background: "radial-gradient(circle, rgba(227, 179, 119, 0.08) 0%, transparent 70%)",
          filter: "blur(70px)",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "10%",
          left: "10%",
          width: "500px",
          height: "500px",
          background: "radial-gradient(circle, rgba(127, 184, 199, 0.07) 0%, transparent 70%)",
          filter: "blur(80px)",
        }}
      />

      {enableStarfield && (
        <canvas
          ref={canvasRef}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            opacity: 0.65,
          }}
        />
      )}
    </div>
  )
}
