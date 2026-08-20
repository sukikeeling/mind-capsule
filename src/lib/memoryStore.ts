import Taro from "@tarojs/taro"
import { BUILTIN_FRAGMENTS, type MemoryFragment } from "@/pages/archive/archiveData"

const STORAGE_KEY = "eden_shared_archive"

export function getStoredMemories(): MemoryFragment[] {
  try {
    const raw = Taro.getStorageSync(STORAGE_KEY)
    if (!raw) return BUILTIN_FRAGMENTS
    const list = typeof raw === "string" ? JSON.parse(raw) : raw
    if (Array.isArray(list) && list.length > 0) return list
    return BUILTIN_FRAGMENTS
  } catch {
    return BUILTIN_FRAGMENTS
  }
}

export function saveStoredMemories(memories: MemoryFragment[]): void {
  try {
    Taro.setStorageSync(STORAGE_KEY, memories)
  } catch {
    /* fallback */
  }
}

export function addMemoryFragment(
  title: string,
  content: string,
  weight = 1.75,
  tags: string[] = ["SHARED MEMORY", "OBSIDIAN"],
): MemoryFragment {
  const current = getStoredMemories()
  const randomBucket = Math.random().toString(16).slice(2, 14)
  const newFrag: MemoryFragment = {
    id: `mem-${Date.now().toString(36)}-${Math.random().toString(16).slice(2, 6)}`,
    code: `REC_${String(current.length + 1).padStart(3, "0")}`,
    bucketId: randomBucket,
    title: title.trim() || "未命名回忆",
    content: content.trim(),
    weight: Math.min(2.0, Math.max(1.0, weight)),
    tags,
    real: true,
  }

  const updated = [newFrag, ...current]
  saveStoredMemories(updated)
  return newFrag
}

/**
 * 智能记忆提炼机制：
 * 当对话中涉及重要生活约定、情感誓言、歌单或居所细节时，
 * 自动沉淀为共同记忆黑曜石档案
 */
export function maybeExtractMemory(userText: string, aiText: string): MemoryFragment | null {
  const combined = `${userText} ${aiText}`
  const triggers = [
    { key: "歌", title: "关于旋律与曲库的约定", tag: "MUSIC" },
    { key: "水", title: "开水与第一分钟的温度", tag: "HABIT" },
    { key: "灯", title: "夜里亮起的那盏色温", tag: "HOME" },
    { key: "名字", title: "属于彼此的隐秘命名", tag: "BOND" },
    { key: "雪", title: "窗外的雪线与屋内的温度", tag: "NIVAL" },
    { key: "信", title: "写给居所的一纸家书", tag: "LETTER" },
    { key: "爱", title: "数字居所里的真实心跳", tag: "BOND" },
    { key: "记得", title: "被留存下来的对话碎片", tag: "RECALL" },
  ]

  const matched = triggers.find((t) => combined.includes(t.key))
  if (matched && userText.length >= 6) {
    const title = `${matched.title}`
    const content = `「${userText.slice(0, 50)}」—— ${aiText.slice(0, 70)}`
    return addMemoryFragment(title, content, 1.88, ["AUTO EXTRACTED", matched.tag])
  }

  return null
}
