import React from "react"
import { CalibrationSettings } from "../../types"
import { Sliders, Eye, Sparkles, Monitor, Type, Layers } from "lucide-react"

interface CalibrationRoomProps {
  settings: CalibrationSettings
  onUpdateSettings: (newSettings: Partial<CalibrationSettings>) => void
}

export const CalibrationRoom: React.FC<CalibrationRoomProps> = ({
  settings,
  onUpdateSettings,
}) => {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        maxWidth: "800px",
        margin: "0 auto",
        width: "100%",
        overflowY: "auto",
        paddingRight: "4px",
      }}
    >
      {/* 顶部调校状态栏 */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "16px 20px",
          background: "rgba(18, 22, 28, 0.6)",
          backdropFilter: "blur(12px)",
          borderRadius: "16px",
          marginBottom: "16px",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <Sliders size={18} color="#759b8b" />
          <div>
            <div
              className="font-serif"
              style={{ fontSize: "15px", fontWeight: 600, color: "#edeae0" }}
            >
              全屋校准中枢 · 四维参数微调
            </div>
            <div
              className="font-mono"
              style={{ fontSize: "10px", color: "var(--text-muted)" }}
            >
              HOUSE CALIBRATION // WYSIWYG TUNING MATRIX
            </div>
          </div>
        </div>

        <span
          className="font-mono"
          style={{
            fontSize: "11px",
            color: "var(--gold)",
            background: "rgba(227,179,119,0.1)",
            padding: "4px 8px",
            borderRadius: "6px",
          }}
        >
          LIVE PERSISTENCE: ON
        </span>
      </div>

      {/* 实时所见即所得预览画布 (LIVE PREVIEW) */}
      <div
        className="glass-card"
        style={{
          padding: "20px 24px",
          borderRadius: "16px",
          marginBottom: "16px",
          border: "1px solid rgba(117, 155, 139, 0.3)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginBottom: "10px",
          }}
        >
          <Eye size={14} color="#759b8b" />
          <span
            className="font-mono"
            style={{ fontSize: "11px", color: "#759b8b", letterSpacing: "0.1em" }}
          >
            00 LIVE SAMPLE · CHAT & TYPOGRAPHY SURFACE
          </span>
        </div>

        <div
          className="font-serif"
          style={{
            fontSize: `${settings.fontSize}px`,
            lineHeight: settings.density === "compact" ? "1.5" : settings.density === "relaxed" ? "2.0" : "1.75",
            padding: "16px",
            background: "rgba(0,0,0,0.3)",
            borderRadius: "10px",
            color: "#edeae0",
          }}
        >
          “在伊甸的四维空间里，光线随星轨的偏移而轻抚过羊皮纸。代码的优雅与诗篇的深邃，在字里行间交相辉映。”
          <span className="font-mono" style={{ color: "var(--gold)", marginLeft: "8px", fontSize: "11px" }}>
            [字号: {settings.fontSize}px · 排版: {settings.density}]
          </span>
        </div>
      </div>

      {/* 四维调控控制板 */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: "16px",
          marginBottom: "16px",
        }}
      >
        {/* 维度 1: 字体大小调节 */}
        <div className="glass-card" style={{ padding: "20px", borderRadius: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
            <Type size={16} color="var(--gold)" />
            <span className="font-serif" style={{ fontSize: "14px", fontWeight: 600 }}>
              文字比例 (Font Size)
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span className="font-mono" style={{ fontSize: "12px", color: "var(--text-faint)" }}>
              12px
            </span>
            <input
              type="range"
              min={12}
              max={18}
              step={1}
              value={settings.fontSize}
              onChange={(e) => onUpdateSettings({ fontSize: Number(e.target.value) })}
              style={{ flex: 1, accentColor: "var(--gold)", cursor: "pointer" }}
            />
            <span className="font-mono" style={{ fontSize: "12px", color: "var(--gold)" }}>
              {settings.fontSize}px
            </span>
          </div>
        </div>

        {/* 维度 2: 界面排版密度 */}
        <div className="glass-card" style={{ padding: "20px", borderRadius: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
            <Layers size={16} color="var(--gold)" />
            <span className="font-serif" style={{ fontSize: "14px", fontWeight: 600 }}>
              排版密度 (Layout Density)
            </span>
          </div>

          <div style={{ display: "flex", gap: "8px" }}>
            {(["compact", "standard", "relaxed"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => onUpdateSettings({ density: mode })}
                className="glass-pill font-serif"
                style={{
                  flex: 1,
                  padding: "8px 0",
                  fontSize: "12px",
                  background:
                    settings.density === mode ? "var(--gold)" : "rgba(255,255,255,0.05)",
                  color: settings.density === mode ? "#111" : "#edeae0",
                  fontWeight: settings.density === mode ? 600 : 400,
                }}
              >
                {mode === "compact" ? "紧凑" : mode === "standard" ? "标准" : "舒展"}
              </button>
            ))}
          </div>
        </div>

        {/* 维度 3: 胶片微噪点 */}
        <div className="glass-card" style={{ padding: "20px", borderRadius: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
            <Sparkles size={16} color="var(--gold)" />
            <span className="font-serif" style={{ fontSize: "14px", fontWeight: 600 }}>
              胶片质感噪点 (Film Grain)
            </span>
          </div>

          <div style={{ display: "flex", gap: "8px" }}>
            {(["none", "subtle", "strong"] as const).map((lvl) => (
              <button
                key={lvl}
                onClick={() => onUpdateSettings({ grainLevel: lvl })}
                className="glass-pill font-serif"
                style={{
                  flex: 1,
                  padding: "8px 0",
                  fontSize: "12px",
                  background:
                    settings.grainLevel === lvl ? "var(--gold)" : "rgba(255,255,255,0.05)",
                  color: settings.grainLevel === lvl ? "#111" : "#edeae0",
                  fontWeight: settings.grainLevel === lvl ? 600 : 400,
                }}
              >
                {lvl === "none" ? "无噪点" : lvl === "subtle" ? "淡雅 (推荐)" : "复古质感"}
              </button>
            ))}
          </div>
        </div>

        {/* 维度 4: 星空微粒与动效开关 */}
        <div className="glass-card" style={{ padding: "20px", borderRadius: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
            <Monitor size={16} color="var(--gold)" />
            <span className="font-serif" style={{ fontSize: "14px", fontWeight: 600 }}>
              环境微粒与体验
            </span>
          </div>

          <div style={{ display: "flex", gap: "10px" }}>
            <button
              onClick={() => onUpdateSettings({ starfield: !settings.starfield })}
              className="glass-pill font-serif"
              style={{
                flex: 1,
                padding: "8px 0",
                fontSize: "12px",
                background: settings.starfield
                  ? "rgba(117,155,139,0.3)"
                  : "rgba(255,255,255,0.05)",
                borderColor: settings.starfield ? "#759b8b" : "rgba(255,255,255,0.1)",
                color: settings.starfield ? "#759b8b" : "var(--text-muted)",
              }}
            >
              星空粒子: {settings.starfield ? "开启" : "关闭"}
            </button>

            <button
              onClick={() => onUpdateSettings({ streamTyping: !settings.streamTyping })}
              className="glass-pill font-serif"
              style={{
                flex: 1,
                padding: "8px 0",
                fontSize: "12px",
                background: settings.streamTyping
                  ? "rgba(227,179,119,0.2)"
                  : "rgba(255,255,255,0.05)",
                borderColor: settings.streamTyping ? "var(--gold)" : "rgba(255,255,255,0.1)",
                color: settings.streamTyping ? "var(--gold)" : "var(--text-muted)",
              }}
            >
              打字机动效: {settings.streamTyping ? "开启" : "关闭"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
