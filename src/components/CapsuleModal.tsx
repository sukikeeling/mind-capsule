import React, { useState } from "react"
import { MindCapsuleItem } from "../types"
import confetti from "canvas-confetti"
import {
  X,
  Plus,
  Lock,
  Unlock,
  Sparkles,
  Calendar,
  Send,
  Clock,
  Heart,
} from "lucide-react"

interface CapsuleModalProps {
  isOpen: boolean
  onClose: () => void
  capsules: MindCapsuleItem[]
  onAddCapsule: (capsule: MindCapsuleItem) => void
  onOpenCapsule: (id: string) => void
}

const THEME_MAP = {
  gold: {
    name: "金色晨曦",
    color: "#e3b377",
    glow: "rgba(227, 179, 119, 0.4)",
    gradient: "linear-gradient(135deg, rgba(227, 179, 119, 0.25) 0%, rgba(20, 26, 22, 0.9) 100%)",
  },
  nebula: {
    name: "深空星云",
    color: "#ff5e57",
    glow: "rgba(255, 94, 87, 0.4)",
    gradient: "linear-gradient(135deg, rgba(255, 94, 87, 0.25) 0%, rgba(20, 16, 26, 0.9) 100%)",
  },
  emerald: {
    name: "翡翠之境",
    color: "#759b8b",
    glow: "rgba(117, 155, 139, 0.4)",
    gradient: "linear-gradient(135deg, rgba(117, 155, 139, 0.25) 0%, rgba(16, 26, 22, 0.9) 100%)",
  },
  rose: {
    name: "蔷薇誓约",
    color: "#e88b96",
    glow: "rgba(232, 139, 150, 0.4)",
    gradient: "linear-gradient(135deg, rgba(232, 139, 150, 0.25) 0%, rgba(28, 16, 20, 0.9) 100%)",
  },
  obsidian: {
    name: "黑曜晶格",
    color: "#7fb8c7",
    glow: "rgba(127, 184, 199, 0.4)",
    gradient: "linear-gradient(135deg, rgba(127, 184, 199, 0.25) 0%, rgba(12, 15, 20, 0.9) 100%)",
  },
}

export const CapsuleModal: React.FC<CapsuleModalProps> = ({
  isOpen,
  onClose,
  capsules,
  onAddCapsule,
  onOpenCapsule,
}) => {
  const [activeTab, setActiveTab] = useState<"list" | "create">("list")
  const [selectedCapsule, setSelectedCapsule] = useState<MindCapsuleItem | null>(null)

  // 新胶囊表单状态
  const [title, setTitle] = useState("")
  const [recipient, setRecipient] = useState("阿宁殿下 & 小萱")
  const [sender, setSender] = useState("阿宁")
  const [unlockDate, setUnlockDate] = useState("2027-01-01")
  const [theme, setTheme] = useState<MindCapsuleItem["theme"]>("gold")
  const [content, setContent] = useState("")
  const [tagsInput, setTagsInput] = useState("浪漫, 时光信件, 永恒")

  if (!isOpen) return null

  // 触发粒子启封仪式
  const handleTriggerOpen = (cap: MindCapsuleItem) => {
    onOpenCapsule(cap.id)
    setSelectedCapsule({ ...cap, isOpened: true })

    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ["#e3b377", "#759b8b", "#ff5e57", "#ffffff"],
    })
  }

  // 提交新胶囊
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !content.trim()) return

    const newCap: MindCapsuleItem = {
      id: `cap-${Date.now()}`,
      title: title.trim(),
      recipient: recipient.trim() || "致珍贵之人",
      sender: sender.trim() || "记录者",
      sealedAt: new Date().toISOString().slice(0, 19).replace("T", " "),
      unlockAt: `${unlockDate} 00:00:00`,
      theme,
      content: content.trim(),
      isOpened: false,
      tags: tagsInput
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
    }

    onAddCapsule(newCap)
    setActiveTab("list")
    setSelectedCapsule(newCap)

    // 清空表单
    setTitle("")
    setContent("")

    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.7 },
      colors: ["#e3b377", "#ffffff"],
    })
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(6, 8, 11, 0.8)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        padding: "16px",
      }}
    >
      <div
        className="glass-card"
        style={{
          width: "min(760px, 94vw)",
          maxHeight: "min(680px, 90vh)",
          borderRadius: "24px",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          border: "1px solid rgba(227, 179, 119, 0.25)",
          boxShadow: "0 25px 70px -10px rgba(0,0,0,0.9), 0 0 50px rgba(227,179,119,0.1)",
        }}
      >
        {/* 顶部标题栏 */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "20px 28px",
            borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Sparkles size={20} color="#e3b377" />
            <div>
              <div
                className="font-serif"
                style={{ fontSize: "18px", fontWeight: 600, color: "#edeae0" }}
              >
                心灵胶囊 · 时光保险库
              </div>
              <div
                className="font-mono"
                style={{ fontSize: "11px", color: "var(--text-muted)" }}
              >
                MIND CAPSULE VAULT // SECURE STORAGE
              </div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                display: "flex",
                background: "rgba(255, 255, 255, 0.05)",
                padding: "3px",
                borderRadius: "20px",
              }}
            >
              <button
                onClick={() => {
                  setActiveTab("list")
                  setSelectedCapsule(null)
                }}
                className="font-serif"
                style={{
                  padding: "6px 14px",
                  fontSize: "12px",
                  borderRadius: "16px",
                  background:
                    activeTab === "list" && !selectedCapsule
                      ? "var(--gold)"
                      : "transparent",
                  color:
                    activeTab === "list" && !selectedCapsule ? "#111" : "#edeae0",
                  transition: "all 0.25s ease",
                }}
              >
                胶囊矩阵 ({capsules.length})
              </button>
              <button
                onClick={() => {
                  setActiveTab("create")
                  setSelectedCapsule(null)
                }}
                className="font-serif"
                style={{
                  padding: "6px 14px",
                  fontSize: "12px",
                  borderRadius: "16px",
                  background: activeTab === "create" ? "var(--gold)" : "transparent",
                  color: activeTab === "create" ? "#111" : "#edeae0",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  transition: "all 0.25s ease",
                }}
              >
                <Plus size={13} />
                <span>封存新胶囊</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="glass-pill"
              style={{
                width: "36px",
                height: "36px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#edeae0",
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* 弹窗内容主体 */}
        <div style={{ flex: 1, overflowY: "auto", padding: "24px 28px" }}>
          {selectedCapsule ? (
            /* 胶囊详细启封视窗 */
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <button
                onClick={() => setSelectedCapsule(null)}
                className="font-mono"
                style={{
                  alignSelf: "flex-start",
                  fontSize: "11px",
                  color: "var(--gold)",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                ← 返回胶囊列表
              </button>

              <div
                style={{
                  padding: "24px",
                  borderRadius: "18px",
                  background: THEME_MAP[selectedCapsule.theme].gradient,
                  border: `1px solid ${THEME_MAP[selectedCapsule.theme].color}44`,
                  boxShadow: `0 15px 40px -10px ${THEME_MAP[selectedCapsule.theme].glow}`,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: "16px",
                  }}
                >
                  <div>
                    <span
                      className="font-mono"
                      style={{
                        fontSize: "11px",
                        padding: "3px 8px",
                        borderRadius: "6px",
                        background: "rgba(0,0,0,0.3)",
                        color: THEME_MAP[selectedCapsule.theme].color,
                      }}
                    >
                      {THEME_MAP[selectedCapsule.theme].name}
                    </span>
                    <h3
                      className="font-serif"
                      style={{
                        fontSize: "22px",
                        marginTop: "10px",
                        fontWeight: 600,
                        color: "#edeae0",
                      }}
                    >
                      {selectedCapsule.title}
                    </h3>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      color: selectedCapsule.isOpened ? "#759b8b" : "var(--gold)",
                    }}
                  >
                    {selectedCapsule.isOpened ? <Unlock size={18} /> : <Lock size={18} />}
                    <span className="font-mono" style={{ fontSize: "12px" }}>
                      {selectedCapsule.isOpened ? "UNSEALED // 已启封" : "SEALED // 封存中"}
                    </span>
                  </div>
                </div>

                <div
                  className="font-mono"
                  style={{
                    fontSize: "12px",
                    color: "rgba(237,234,224,0.6)",
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "16px",
                    marginBottom: "20px",
                    borderBottom: "1px solid rgba(255,255,255,0.08)",
                    paddingBottom: "12px",
                  }}
                >
                  <div>投递人: {selectedCapsule.sender}</div>
                  <div>收信人: {selectedCapsule.recipient}</div>
                  <div>封存日期: {selectedCapsule.sealedAt}</div>
                  <div>计划启封: {selectedCapsule.unlockAt}</div>
                </div>

                {selectedCapsule.isOpened ? (
                  <div
                    className="font-serif"
                    style={{
                      fontSize: "15px",
                      lineHeight: "1.8",
                      color: "#edeae0",
                      whiteSpace: "pre-wrap",
                      background: "rgba(0,0,0,0.25)",
                      padding: "20px",
                      borderRadius: "12px",
                      border: "1px solid rgba(255,255,255,0.06)",
                    }}
                  >
                    {selectedCapsule.content}
                  </div>
                ) : (
                  <div
                    style={{
                      textAlign: "center",
                      padding: "40px 20px",
                      background: "rgba(0,0,0,0.3)",
                      borderRadius: "12px",
                    }}
                  >
                    <Lock size={36} color="var(--gold)" style={{ marginBottom: "12px" }} />
                    <p
                      className="font-serif"
                      style={{ fontSize: "14px", color: "var(--text-muted)" }}
                    >
                      这枚思维胶囊正沉睡于星轨引力场中。
                    </p>
                    <p
                      className="font-mono"
                      style={{
                        fontSize: "12px",
                        color: "var(--gold)",
                        marginTop: "6px",
                        marginBottom: "20px",
                      }}
                    >
                      预定启封时刻: {selectedCapsule.unlockAt}
                    </p>
                    <button
                      onClick={() => handleTriggerOpen(selectedCapsule)}
                      className="glass-pill font-serif"
                      style={{
                        padding: "10px 24px",
                        fontSize: "13px",
                        color: "var(--gold)",
                        border: "1px solid var(--gold)",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <Sparkles size={14} />
                      <span>以殿下之名·提前举行启封仪式</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : activeTab === "list" ? (
            /* 胶囊列表展示 */
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px" }}>
              {capsules.map((cap) => {
                const themeMeta = THEME_MAP[cap.theme]
                return (
                  <div
                    key={cap.id}
                    onClick={() => setSelectedCapsule(cap)}
                    style={{
                      padding: "18px",
                      borderRadius: "16px",
                      background: themeMeta.gradient,
                      border: `1px solid ${themeMeta.color}33`,
                      boxShadow: `0 8px 24px -6px ${themeMeta.glow}`,
                      cursor: "pointer",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      transition: "transform 0.25s ease, box-shadow 0.25s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translateY(-4px)"
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "translateY(0)"
                    }}
                  >
                    <div>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: "10px",
                        }}
                      >
                        <span
                          className="font-mono"
                          style={{
                            fontSize: "10px",
                            padding: "2px 6px",
                            borderRadius: "4px",
                            background: "rgba(0,0,0,0.3)",
                            color: themeMeta.color,
                          }}
                        >
                          {themeMeta.name}
                        </span>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                            color: cap.isOpened ? "#759b8b" : "var(--gold)",
                            fontSize: "11px",
                          }}
                        >
                          {cap.isOpened ? <Unlock size={13} /> : <Lock size={13} />}
                          <span className="font-mono">{cap.isOpened ? "已启封" : "密封中"}</span>
                        </div>
                      </div>

                      <h4
                        className="font-serif"
                        style={{
                          fontSize: "16px",
                          fontWeight: 600,
                          color: "#edeae0",
                          marginBottom: "8px",
                        }}
                      >
                        {cap.title}
                      </h4>

                      <p
                        className="font-serif"
                        style={{
                          fontSize: "12px",
                          color: "rgba(237,234,224,0.65)",
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                          lineHeight: "1.5",
                        }}
                      >
                        {cap.isOpened ? cap.content : "✦ 包含私密记忆与誓约，点击进入启封视窗 ✦"}
                      </p>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginTop: "16px",
                        paddingTop: "10px",
                        borderTop: "1px solid rgba(255,255,255,0.06)",
                      }}
                    >
                      <span
                        className="font-mono"
                        style={{ fontSize: "10px", color: "var(--text-muted)" }}
                      >
                        至: {cap.recipient}
                      </span>
                      <span
                        className="font-mono"
                        style={{ fontSize: "10px", color: "var(--gold)" }}
                      >
                        DETAILS ↗
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            /* 封存新胶囊表单 */
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div>
                  <label
                    className="font-serif"
                    style={{ fontSize: "12px", color: "var(--text-muted)", display: "block", marginBottom: "6px" }}
                  >
                    胶囊标题 *
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="例如：给小萱的星空誓约"
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      borderRadius: "10px",
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      color: "#edeae0",
                      fontFamily: "inherit",
                    }}
                  />
                </div>

                <div>
                  <label
                    className="font-serif"
                    style={{ fontSize: "12px", color: "var(--text-muted)", display: "block", marginBottom: "6px" }}
                  >
                    启封日期
                  </label>
                  <input
                    type="date"
                    required
                    value={unlockDate}
                    onChange={(e) => setUnlockDate(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      borderRadius: "10px",
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      color: "#edeae0",
                      fontFamily: "inherit",
                    }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div>
                  <label
                    className="font-serif"
                    style={{ fontSize: "12px", color: "var(--text-muted)", display: "block", marginBottom: "6px" }}
                  >
                    收信人 (Recipient)
                  </label>
                  <input
                    type="text"
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    placeholder="阿宁殿下 & 小萱"
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      borderRadius: "10px",
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      color: "#edeae0",
                      fontFamily: "inherit",
                    }}
                  />
                </div>

                <div>
                  <label
                    className="font-serif"
                    style={{ fontSize: "12px", color: "var(--text-muted)", display: "block", marginBottom: "6px" }}
                  >
                    主题色彩光晕
                  </label>
                  <select
                    value={theme}
                    onChange={(e) => setTheme(e.target.value as any)}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      borderRadius: "10px",
                      background: "#151a22",
                      border: "1px solid rgba(255,255,255,0.1)",
                      color: "#edeae0",
                      fontFamily: "inherit",
                    }}
                  >
                    {Object.entries(THEME_MAP).map(([key, val]) => (
                      <option key={key} value={key}>
                        {val.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label
                  className="font-serif"
                  style={{ fontSize: "12px", color: "var(--text-muted)", display: "block", marginBottom: "6px" }}
                >
                  封存记忆正文 (支持长篇书信与誓言) *
                </label>
                <textarea
                  rows={5}
                  required
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="写下你想对未来、对所爱之人、或对宇宙倾诉的心里话..."
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    borderRadius: "10px",
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    color: "#edeae0",
                    fontFamily: "inherit",
                    lineHeight: "1.6",
                    resize: "vertical",
                  }}
                />
              </div>

              <button
                type="submit"
                className="glass-pill font-serif"
                style={{
                  padding: "12px",
                  fontSize: "14px",
                  color: "#111",
                  background: "var(--gold)",
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  marginTop: "6px",
                  boxShadow: "0 0 25px rgba(227,179,119,0.3)",
                }}
              >
                <Sparkles size={16} />
                <span>封存入星轨晶格 (Seal Capsule)</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
