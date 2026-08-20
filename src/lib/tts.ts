/**
 * EDEN 47 · 伴读者语音朗读引擎 (Web Speech Synthesis)
 * 支持真实语音朗读、语速微调、自然人声匹配与状态订阅。
 */

let currentUtterance: SpeechSynthesisUtterance | null = null

export function isTtsSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window
}

export function stopSpeaking(): void {
  if (!isTtsSupported()) return
  try {
    window.speechSynthesis.cancel()
    currentUtterance = null
  } catch {
    /* ignore */
  }
}

export function isSpeaking(): boolean {
  if (!isTtsSupported()) return false
  return window.speechSynthesis.speaking
}

export function speakText(
  rawText: string,
  options?: {
    lang?: "zh" | "en"
    rate?: number
    pitch?: number
    onStart?: () => void
    onEnd?: () => void
  },
): boolean {
  if (!isTtsSupported()) return false

  // 清洗文本中的代码标签与反引号
  const cleanText = rawText.replace(/`([^`]+)`/g, "$1").replace(/[\[\]]/g, "").trim()
  if (!cleanText) return false

  stopSpeaking()

  try {
    const utterance = new SpeechSynthesisUtterance(cleanText)
    const isEn = options?.lang === "en"
    utterance.lang = isEn ? "en-US" : "zh-CN"
    utterance.rate = options?.rate ?? (isEn ? 0.95 : 0.9) // 温柔克制的家书慢读语速
    utterance.pitch = options?.pitch ?? 1.0

    // 优先选取温润自然的人声
    const voices = window.speechSynthesis.getVoices()
    if (voices.length > 0) {
      const match = isEn
        ? voices.find((v) => v.lang.startsWith("en") && (v.name.includes("Natural") || v.name.includes("Samantha") || v.name.includes("Google")))
        : voices.find((v) => v.lang.startsWith("zh") && (v.name.includes("Natural") || v.name.includes("Xiaoxiao") || v.name.includes("Tingting") || v.name.includes("Chinese")))
      if (match) utterance.voice = match
    }

    utterance.onstart = () => {
      options?.onStart?.()
    }
    utterance.onend = () => {
      currentUtterance = null
      options?.onEnd?.()
    }
    utterance.onerror = () => {
      currentUtterance = null
      options?.onEnd?.()
    }

    currentUtterance = utterance
    window.speechSynthesis.speak(utterance)
    return true
  } catch {
    return false
  }
}
