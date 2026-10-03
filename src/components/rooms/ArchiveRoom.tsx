import React, { useState } from "react"
import { INITIAL_MEMORIES } from "../../data/memories"
import { MemoryFragment } from "../../types"
import { Database, Filter, Plus, ChevronDown, ChevronUp, Lock, Sparkles, Hash } from "lucide-react"

const CATEGORIES = [
  { key: "all", label: "全部碎片 (ALL)" },
  { key: "romance", label: "浪漫誓约" },
  { key: "genesis", label: "创世与代码" },
  { key: "chronicle", label: "空间日志" },
  { key: "signal", label: "深空信标" },
  { key: "drift", label: "星轨漂流" },
]

export const ArchiveRoom: React.FC = () => {
  const [memories, setMemories] = useState<MemoryFragment[]>(() => {
    const saved = localStorage.getItem("eden_custom_memories")
    if (saved) {
      try {
        return [...JSON.parse(saved), ...INITIAL_MEMORIES]
      } catch (e) {
        return INITIAL_MEMORIES
      }
    }
    return INITIAL_MEMORIES
  })

  const [filter, setFilter] = useState("all")
  const [expandedId, setExpandedId] = useState<string | null>("mem-01")
  const [showAddForm, setShowAddForm] = useState(false)

  // 添加新碎片表单
  const [newTitle, setNewTitle] = useState("")
  const [newSummary, setNewSummary] = useState("")
  const [newContent, setNewContent] = useState("")
  const [newCategory, setNewCategory] = useState<MemoryFragment["category"]>("romance")

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTitle.trim() || !newContent.trim()) return

    const item: MemoryFragment = {
      id: `mem-${Date.now()}`,
      title: newTitle.trim(),
      summary: newSummary.trim() || newTitle.trim(),
      content: newContent.trim(),
      category: newCategory,
      vectorWeight: Number((Math.random() * 0.1 + 0.9).toFixed(3)),
      bucketId: `user-vault-${Date.now().toString().slice(-4)}`,
      date: new Date().toISOString().slice(0, 10),
    }

    const updated = [item, ...memories]
    setMemories(updated)
    setExpandedId(item.id)
    setShowAddForm(false)

    // 保存自定义碎片到本地
    const userOnly = updated.filter((m) => m.id.startsWith("mem-") && Number(m.id.slice(4)) > 100)
    localStorage.setItem("eden_custom_memories", JSON.stringify(userOnly))

    setNewTitle("")
    setNewSummary("")
    setNewContent("")
  }

  const filteredMemories =
    filter === "all"
      ? memories
      : memories.filter((m) => m.category === filter)

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        maxWidth: "840px",
        margin: "0 auto",
        width: "100%",
      }}
    >
      {/* 顶部档案元数据栏 */}
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
          <Database size={18} color="#7fb8c7" />
          <div>
            <div
              className="font-serif"
              style={{ fontSize: "15px", fontWeight: 600, color: "#edeae0" }}
            >
              黑曜石共同记忆库 · 372 碎片矩阵
            </div>
            <div
              className="font-mono"
              style={{ fontSize: "10px", color: "var(--text-muted)" }}
            >
              KEEPERS: 47, B, N // VECTOR INDEX: COSINE_SIMILARITY
            </div>
          </div>
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
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
          <Plus size={14} />
          <span>刻录新碎片</span>
        </button>
      </div>

      {/* 新增记忆碎片抽屉 */}
      {showAddForm && (
        <form
          onSubmit={handleAdd}
          className="glass-card"
          style={{
            padding: "20px",
            borderRadius: "14px",
            marginBottom: "16px",
            border: "1px solid rgba(127, 184, 199, 0.3)",
          }}
        >
          <div
            className="font-mono"
            style={{ fontSize: "11px", color: "#7fb8c7", marginBottom: "12px" }}
          >
            APPEND VECTOR RECORD // 追加不可篡改晶格
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "12px", marginBottom: "12px" }}>
            <input
              type="text"
              required
              placeholder="碎片主题（例如：初雪夜的温茶）"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              style={{
                padding: "8px 12px",
                borderRadius: "8px",
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "#edeae0",
                fontSize: "13px",
              }}
            />
            <select
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value as any)}
              style={{
                padding: "8px 12px",
                borderRadius: "8px",
                background: "#161c24",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "#edeae0",
                fontSize: "13px",
              }}
            >
              <option value="romance">浪漫誓约</option>
              <option value="genesis">创世与代码</option>
              <option value="chronicle">空间日志</option>
              <option value="signal">深空信标</option>
              <option value="drift">星轨漂流</option>
            </select>
          </div>

          <textarea
            required
            rows={3}
            placeholder="记忆正文（高维向量沉淀）..."
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
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
              onClick={() => setShowAddForm(false)}
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
              铭刻入星空
            </button>
          </div>
        </form>
      )}

      {/* 分类过滤器条 */}
      <div
        style={{
          display: "flex",
          gap: "8px",
          overflowX: "auto",
          paddingBottom: "10px",
          marginBottom: "12px",
        }}
      >
        {CATEGORIES.map((cat) => (
          <button
            key={cat.key}
            onClick={() => setFilter(cat.key)}
            className="glass-pill font-mono"
            style={{
              padding: "5px 12px",
              fontSize: "11px",
              whiteSpace: "nowrap",
              background: filter === cat.key ? "rgba(127, 184, 199, 0.2)" : "rgba(255,255,255,0.04)",
              borderColor: filter === cat.key ? "#7fb8c7" : "rgba(255,255,255,0.08)",
              color: filter === cat.key ? "#7fb8c7" : "var(--text-muted)",
            }}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* 记忆碎片卡片瀑布流 */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
          paddingRight: "4px",
        }}
      >
        {filteredMemories.map((mem) => {
          const isExp = expandedId === mem.id
          return (
            <div
              key={mem.id}
              onClick={() => setExpandedId(isExp ? null : mem.id)}
              className="glass-card"
              style={{
                padding: "16px 20px",
                borderRadius: "14px",
                cursor: "pointer",
                border: isExp
                  ? "1px solid rgba(127, 184, 199, 0.4)"
                  : "1px solid rgba(255, 255, 255, 0.06)",
                transition: "all 0.3s ease",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span
                    className="font-mono"
                    style={{
                      fontSize: "10px",
                      color: "var(--gold)",
                      background: "rgba(227,179,119,0.12)",
                      padding: "2px 6px",
                      borderRadius: "4px",
                    }}
                  >
                    权重: {mem.vectorWeight}
                  </span>
                  <h4
                    className="font-serif"
                    style={{ fontSize: "16px", fontWeight: 600, color: "#edeae0" }}
                  >
                    {mem.title}
                  </h4>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span
                    className="font-mono"
                    style={{ fontSize: "10px", color: "var(--text-faint)" }}
                  >
                    {mem.date}
                  </span>
                  {isExp ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </div>
              </div>

              {/* 折叠/展开内容 */}
              {isExp ? (
                <div
                  style={{
                    marginTop: "14px",
                    paddingTop: "12px",
                    borderTop: "1px solid rgba(255, 255, 255, 0.08)",
                  }}
                >
                  <p
                    className="font-serif"
                    style={{
                      fontSize: "14px",
                      lineHeight: "1.8",
                      color: "rgba(237, 234, 224, 0.85)",
                      marginBottom: "12px",
                    }}
                  >
                    {mem.content}
                  </p>
                  <div
                    className="font-mono"
                    style={{
                      fontSize: "10px",
                      color: "var(--text-faint)",
                      display: "flex",
                      gap: "12px",
                    }}
                  >
                    <span>BUCKET: {mem.bucketId}</span>
                    <span>CATEGORY: {mem.category.toUpperCase()}</span>
                    <span>IMMUTABLE: VERIFIED</span>
                  </div>
                </div>
              ) : (
                <p
                  className="font-serif"
                  style={{
                    fontSize: "12px",
                    color: "var(--text-muted)",
                    marginTop: "6px",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {mem.summary}
                </p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
