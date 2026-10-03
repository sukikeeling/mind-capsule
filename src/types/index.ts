export interface SpecimenCard {
  id: string
  roman: string
  metaLines: string[]
  enSub: string
  title: string
  tags: string
  art: string
  artGradients: string
  artSize: string
  metaTheme: "light" | "dark"
  accentColor: string
}

export interface MemoryFragment {
  id: string
  title: string
  summary: string
  category: "romance" | "chronicle" | "drift" | "genesis" | "signal"
  vectorWeight: number
  bucketId: string
  date: string
  content: string
  locked?: boolean
}

export interface Track {
  id: string
  title: string
  artist: string
  duration: string
  note: string
  lyrics?: string[]
}

export interface StoryNode {
  id: string
  date: string
  title: string
  location: string
  summary: string
  text: string
  tag: string
}

export interface MindCapsuleItem {
  id: string
  title: string
  recipient: string
  sender: string
  sealedAt: string
  unlockAt: string
  theme: "gold" | "nebula" | "emerald" | "rose" | "obsidian"
  content: string
  isOpened: boolean
  tags: string[]
}

export interface CalibrationSettings {
  fontSize: number // 12 ~ 18
  density: "compact" | "standard" | "relaxed"
  motionLevel: "full" | "gentle" | "minimal"
  grainLevel: "none" | "subtle" | "strong"
  starfield: boolean
  streamTyping: boolean
}
