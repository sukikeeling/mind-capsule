import React, { useState } from "react"
import { INITIAL_STORY_NODES } from "../../data/storyData"
import { StoryNode } from "../../types"
import { MapPin, Navigation, Edit3, Sparkles, Plus, Compass } from "lucide-react"

export const StoryRoom: React.FC = () => {
  const [nodes, setNodes] = useState<StoryNode[]>(() => {
    const saved = localStorage.getItem("eden_custom_story_nodes")
    if (saved) {
      try {
        return [...INITIAL_STORY_NODES, ...JSON.parse(saved)]
      } catch (e) {
        return INITIAL_STORY_NODES
      }
    }
    return INITIAL_STORY_NODES
  })

  const [activeNodeId, setActiveNodeId] = useState(nodes[nodes.length - 1].id)
  const [showAddDrawer, setShowAddDrawer] = useState(false)

  // 自主书写状态
  const [dateInput, setDateInput] = useState(
    new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit" }).toUpperCase()
  )
  const [titleInput, setTitleInput] = useState("")
  const [locInput, setLocInput] = useState("NEW_COORDINATES // UNCHARTED")
  const [textInput, setTextInput] = useState("")

  const activeNode = nodes.find((n) => n.id === activeNodeId) || nodes[0]

  const handleAddStory = (e: React.FormEvent) => {
    e.preventDefault()
    if (!titleInput.trim() || !textInput.trim()) return

    const newNode: StoryNode = {
      id: `node-${Date.now()}`,
      date: dateInput.trim(),
      title: titleInput.trim(),
      location: locInput.trim(),
      summary: textInput.trim().slice(0, 40) + "...",
      text: textInput.trim(),
      tag: "FIELD_LOG",
    }

    const updated = [...nodes, newNode]
    setNodes(updated)
    setActiveNodeId(newNode.id)
    setShowAddDrawer(false)

    // 保存至本地
    const userOnly = updated.filter((n) => !INITIAL_STORY_NODES.some((inNode) => inNode.id === n.id))
    localStorage.setItem("eden_custom_story_nodes", JSON.stringify(userOnly))

    setTitleInput("")
    setTextInput("")
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        maxWidth: "860px",
        margin: "0 auto",
        width: "100%",
      }}
    >
      {/* 顶部航海罗盘状态栏 */}
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
          <Compass size={18} color="#e3b377" />
          <div>
            <div
              className="font-serif"
              style={{ fontSize: "15px", fontWeight: 600, color: "#edeae0" }}
            >
              星轨航海地图 · MAP 047
            </div>
            <div
              className="font-mono"
              style={{ fontSize: "10px", color: "var(--text-muted)" }}
            >
              SCALE: 1:47 // NODES: 0{nodes.length} TOTAL
            </div>
          </div>
        </div>

        <button
          onClick={() => setShowAddDrawer(!showAddDrawer)}
          className="glass-pill font-serif"
          style={{
            padding: "6px 14px",
            fontSize: "12px",
            color: "var(--gold)",
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <Edit3 size={13} />
          <span>自主书写场景</span>
        </button>
      </div>

      {/* 自主手写抽屉 */}
      {showAddDrawer && (
        <form
          onSubmit={handleAddStory}
          className="glass-card"
          style={{
            padding: "20px",
            borderRadius: "16px",
            marginBottom: "16px",
            border: "1px solid rgba(227, 179, 119, 0.3)",
          }}
        >
          <div
            className="font-mono"
            style={{ fontSize: "11px", color: "var(--gold)", marginBottom: "12px" }}
          >
            WRITE TO TIME MAP // 插入自定义星轨航标
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "12px", marginBottom: "12px" }}>
            <input
              type="text"
              required
              value={dateInput}
              onChange={(e) => setDateInput(e.target.value)}
              placeholder="日期标识 (例如: 03 OCT)"
              style={{
                padding: "8px 12px",
                borderRadius: "8px",
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "#edeae0",
                fontFamily: "var(--font-mono)",
                fontSize: "13px",
              }}
            />
            <input
              type="text"
              required
              value={titleInput}
              onChange={(e) => setTitleInput(e.target.value)}
              placeholder="场景标题 (例如: 霜降前的炉火)"
              style={{
                padding: "8px 12px",
                borderRadius: "8px",
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "#edeae0",
                fontSize: "13px",
              }}
            />
          </div>

          <textarea
            required
            rows={3}
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder="现场日志描述与漫游心绪..."
            style={{
              width: "100%",
              padding: "10px 12px",
              borderRadius: "8px",
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "#edeae0",
              fontSize: "13px",
              marginBottom: "12px",
              resize: "vertical",
            }}
          />

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
            <button
              type="button"
              onClick={() => setShowAddDrawer(false)}
              className="glass-pill"
              style={{ padding: "6px 14px", fontSize: "12px", color: "var(--text-muted)" }}
            >
              取消
            </button>
            <button
              type="submit"
              className="glass-pill font-serif"
              style={{
                padding: "6px 16px",
                fontSize: "12px",
                color: "#111",
                background: "var(--gold)",
                fontWeight: 600,
              }}
            >
              锚定到航线
            </button>
          </div>
        </form>
      )}

      {/* 航海虚线星图可视化 SVG */}
      <div
        className="glass-card"
        style={{
          borderRadius: "16px",
          padding: "20px",
          marginBottom: "16px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <svg viewBox="0 0 760 140" style={{ width: "100%", height: "auto" }}>
          {/* 星海微光网格 */}
          <defs>
            <linearGradient id="orbitGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#2b443b" />
              <stop offset="50%" stopColor="#e3b377" />
              <stop offset="100%" stopColor="#ff5e57" />
            </linearGradient>
          </defs>

          {/* 航海虚线轨迹 */}
          <path
            d="M 50 70 Q 200 20 380 70 T 710 70"
            fill="none"
            stroke="url(#orbitGrad)"
            strokeWidth="2"
            strokeDasharray="6 6"
            opacity="0.8"
          />

          {/* 各航点圆圈 */}
          {nodes.map((node, idx) => {
            const pct = idx / (nodes.length - 1 || 1)
            const cx = 50 + pct * 660
            // 简单的贝塞尔曲线高度近似
            const cy = 70 + Math.sin(pct * Math.PI) * -30
            const isSel = node.id === activeNodeId

            return (
              <g
                key={node.id}
                onClick={() => setActiveNodeId(node.id)}
                style={{ cursor: "pointer" }}
              >
                {/* 选中脉冲光环 */}
                {isSel && (
                  <circle
                    cx={cx}
                    cy={cy}
                    r="14"
                    fill="none"
                    stroke="#e3b377"
                    strokeWidth="1.5"
                    className="animate-pulse"
                  />
                )}
                <circle
                  cx={cx}
                  cy={cy}
                  r={isSel ? "6" : "4.5"}
                  fill={isSel ? "#e3b377" : "#edeae0"}
                />
                <text
                  x={cx}
                  y={cy + 22}
                  textAnchor="middle"
                  fill={isSel ? "#e3b377" : "rgba(237,234,224,0.6)"}
                  fontSize="10"
                  fontFamily="monospace"
                >
                  {node.date}
                </text>
              </g>
            )
          })}
        </svg>
      </div>

      {/* 当前选中节点现场日志档案卡 (FIELD NOTE) */}
      <div
        className="glass-card"
        style={{
          flex: 1,
          padding: "24px 28px",
          borderRadius: "16px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          border: "1px solid rgba(227, 179, 119, 0.25)",
        }}
      >
        <div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "12px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span
                className="font-mono"
                style={{
                  fontSize: "11px",
                  padding: "3px 8px",
                  borderRadius: "6px",
                  background: "rgba(227, 179, 119, 0.15)",
                  color: "var(--gold)",
                }}
              >
                FIELD NOTE // {activeNode.date}
              </span>
              <span
                className="font-mono"
                style={{ fontSize: "10px", color: "var(--text-faint)" }}
              >
                {activeNode.location}
              </span>
            </div>

            <span
              className="font-mono"
              style={{
                fontSize: "10px",
                color: "#759b8b",
                border: "1px solid rgba(117,155,139,0.3)",
                padding: "2px 6px",
                borderRadius: "4px",
              }}
            >
              {activeNode.tag}
            </span>
          </div>

          <h3
            className="font-serif"
            style={{
              fontSize: "20px",
              fontWeight: 600,
              color: "#edeae0",
              marginBottom: "14px",
            }}
          >
            {activeNode.title}
          </h3>

          <p
            className="font-serif"
            style={{
              fontSize: "14.5px",
              lineHeight: "1.8",
              color: "rgba(237, 234, 224, 0.85)",
            }}
          >
            {activeNode.text}
          </p>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: "20px",
            paddingTop: "12px",
            borderTop: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <span
            className="font-mono"
            style={{ fontSize: "10px", color: "var(--text-faint)" }}
          >
            COORDINATE VERIFIED BY TIME LOG
          </span>
          <span
            className="font-serif"
            style={{ fontSize: "12px", color: "var(--gold)", fontStyle: "italic" }}
          >
            ✦ 随星轨向未来延伸 ✦
          </span>
        </div>
      </div>
    </div>
  )
}
