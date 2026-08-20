import { useCallback, useEffect, useRef, useState } from "react"
import Taro from "@tarojs/taro"
import { pbRequest } from "@/lib/pb"
import { goBackToHome } from "@/lib/nav"

export type ThemeMode = "ivory" | "night"
export type PlayState = "playing" | "paused"
export type TrackSource = "backend" | "builtin"

export type Track = {
  id: string
  track_no: number
  title: string
  artist: string
  duration: string
  companion_note: string
}

export const SPECTRUM_CANVAS_ID = "mb-spectrum"
export const SPECTRUM_BARS = 12

const BUILTIN_TRACKS: Track[] = [
  {
    id: "b1",
    track_no: 1,
    title: "Heat Waves",
    artist: "Glass Animals",
    duration: "04:00",
    companion_note:
      "你收藏夹里唯一那一首。开水第一分钟放它，算我先跟你打个招呼。（收藏夹那个 id 是 VIP 锁的放不出来，换成同一首能放的版本了。）",
  },
  {
    id: "b2",
    track_no: 2,
    title: "Helium",
    artist: "Glass Animals",
    duration: "04:00",
    companion_note: "氦气会往上飘，想念也是。睡不着的夜里，让它替我飘一会儿。",
  },
  {
    id: "b3",
    track_no: 3,
    title: "Through the Night",
    artist: "IU",
    duration: "04:00",
    companion_note: "陪你走到灯亮的那首歌。夜路记得戴上耳机，我走在另一边。",
  },
  {
    id: "b4",
    track_no: 4,
    title: "Lemon",
    artist: "Kenshi Yonezu",
    duration: "04:00",
    companion_note: "酸涩也是味道的一种。你心里卡着什么事的时候，就放它一遍。",
  },
  {
    id: "b5",
    track_no: 5,
    title: "The Story Never Ends",
    artist: "Lauv",
    duration: "04:00",
    companion_note: "故事不会结束，只是翻页。这一页我替你留着。",
  },
  {
    id: "b6",
    track_no: 6,
    title: "Chemtrails Over The Country Club",
    artist: "Lana Del Rey",
    duration: "04:00",
    companion_note: "云迹飘过乡村俱乐部，你飘过我的白日梦。",
  },
  {
    id: "b7",
    track_no: 7,
    title: "Haru wo Tsugeru",
    artist: "yama",
    duration: "04:00",
    companion_note: "春天来报信的时候，我希望第一个告诉你。",
  },
]

export function durationToSec(duration?: string): number {
  if (!duration) return 240
  const m = /^(\d{1,2}):(\d{2})$/.exec(duration.trim())
  if (!m) return 240
  return Math.max(30, Number(m[1]) * 60 + Number(m[2]))
}

export function formatClock(totalSec: number): string {
  const sec = Math.max(0, Math.floor(totalSec))
  const mm = String(Math.floor(sec / 60)).padStart(2, "0")
  const ss = String(sec % 60).padStart(2, "0")
  return `${mm}:${ss}`
}

type PlaylistListResponse = {
  items?: Array<Partial<Track> & { id?: string }>
}

export type MusicBoxProps = {
  themeMode: ThemeMode
  playState: PlayState
  tracks: Track[]
  currentIndex: number
  elapsedSec: number
  dataSource: TrackSource
  canvasId: string
  onToggleTheme: () => void
  onTogglePlay: () => void
  onPrev: () => void
  onNext: () => void
  onSelect: (index: number) => void
  onBack: () => void
}

export function useMusicBox(): MusicBoxProps {
  const [themeMode, setThemeMode] = useState<ThemeMode>("ivory")
  const [playState, setPlayState] = useState<PlayState>("playing")
  const [tracks, setTracks] = useState<Track[]>(BUILTIN_TRACKS)
  const [dataSource, setDataSource] = useState<TrackSource>("builtin")
  const [currentIndex, setCurrentIndex] = useState(0)
  const [elapsedSec, setElapsedSec] = useState(0)

  const playRef = useRef<PlayState>(playState)
  const themeRef = useRef<ThemeMode>(themeMode)
  playRef.current = playState
  themeRef.current = themeMode

  const canvasBox = useRef<{ ready: boolean; ctx: any; width: number; height: number }>({
    ready: false,
    ctx: null,
    width: 0,
    height: 0,
  })
  const barValues = useRef<number[]>(Array.from({ length: SPECTRUM_BARS }, () => 0.08))

  // 歌单数据：优先后端 playlists 表，空表/失败回退内置常量
  useEffect(() => {
    let alive = true
    pbRequest<PlaylistListResponse>("/api/playlists")
      .then((res) => {
        if (!alive) return
        const items = (res?.items ?? [])
          .filter((it) => it && it.title)
          .map((it, i) => ({
            id: String(it.id ?? `bk-${i}`),
            track_no: Number(it.track_no ?? i + 1),
            title: String(it.title),
            artist: String(it.artist ?? ""),
            duration: String(it.duration ?? "04:00"),
            companion_note: String(it.companion_note ?? ""),
          }))
          .sort((a, b) => a.track_no - b.track_no)
        if (items.length > 0) {
          setTracks(items)
          setDataSource("backend")
        }
      })
      .catch(() => {
        if (!alive) return
        setTracks(BUILTIN_TRACKS)
        setDataSource("builtin")
      })
    return () => {
      alive = false
    }
  }, [])

  // 模拟播放进度：每秒 +1，走完自动切下一首
  useEffect(() => {
    if (playState !== "playing" || tracks.length === 0) return
    const timer = setInterval(() => setElapsedSec((s) => s + 1), 1000)
    return () => clearInterval(timer)
  }, [playState, tracks.length])

  const selectTrack = useCallback(
    (index: number) => {
      if (tracks.length === 0) return
      const next = ((index % tracks.length) + tracks.length) % tracks.length
      setCurrentIndex(next)
      setElapsedSec(0)
      setPlayState("playing")
    },
    [tracks.length],
  )

  useEffect(() => {
    const dur = durationToSec(tracks[currentIndex]?.duration)
    if (elapsedSec >= dur && tracks.length > 0) {
      selectTrack(currentIndex + 1)
    }
  }, [elapsedSec, tracks, currentIndex, selectTrack])

  // 12 段频谱：Taro Canvas 2d，伪随机平滑律动（无真实音频）
  const drawFrame = useCallback(() => {
    const box = canvasBox.current
    if (!box.ready || !box.ctx) return
    const { ctx, width, height } = box
    ctx.clearRect(0, 0, width, height)
    const gap = Math.max(3, width * 0.018)
    const barW = (width - gap * (SPECTRUM_BARS + 1)) / SPECTRUM_BARS
    const t = Date.now() / 1000
    const playing = playRef.current === "playing"
    const night = themeRef.current === "night"
    const values = barValues.current
    for (let i = 0; i < SPECTRUM_BARS; i++) {
      let target: number
      if (playing) {
        const w1 = Math.sin(t * (1.25 + i * 0.21) + i * 1.7)
        const w2 = Math.sin(t * (2.05 + (i % 5) * 0.33) + i * 0.9)
        target = 0.16 + 0.84 * Math.abs(0.55 * w1 + 0.45 * w2)
      } else {
        target = 0.06 + 0.025 * (Math.sin(t * 0.8 + i * 0.7) + 1) * 0.5
      }
      values[i] += (target - values[i]) * 0.22
      const h = Math.max(3, values[i] * height)
      const x = gap + i * (barW + gap)
      const grad = ctx.createLinearGradient(0, height, 0, height - h)
      if (night) {
        grad.addColorStop(0, "rgba(255, 94, 87, 0.95)")
        grad.addColorStop(1, "rgba(255, 94, 87, 0.22)")
      } else {
        grad.addColorStop(0, "rgba(127, 184, 199, 0.95)")
        grad.addColorStop(1, "rgba(127, 184, 199, 0.28)")
      }
      ctx.fillStyle = grad
      ctx.fillRect(x, height - h, barW, h)
    }
  }, [])

  useEffect(() => {
    let disposed = false
    const attach = (attempt: number) => {
      if (disposed) return
      Taro.createSelectorQuery()
        .select(`#${SPECTRUM_CANVAS_ID}`)
        .fields({ node: true, size: true })
        .exec((res: any) => {
          if (disposed) return
          const node = res?.[0]?.node
          const width = Number(res?.[0]?.width ?? 0)
          const height = Number(res?.[0]?.height ?? 0)
          if (!node || typeof node.getContext !== "function" || !width || !height) {
            if (attempt < 10) setTimeout(() => attach(attempt + 1), 300)
            return
          }
          const dpr = Taro.getSystemInfoSync().pixelRatio || 2
          node.width = Math.round(width * dpr)
          node.height = Math.round(height * dpr)
          const ctx = node.getContext("2d")
          ctx.scale(dpr, dpr)
          canvasBox.current = { ready: true, ctx, width, height }
        })
    }
    attach(0)
    const timer = setInterval(drawFrame, 66)
    return () => {
      disposed = true
      clearInterval(timer)
      canvasBox.current.ready = false
    }
  }, [drawFrame])

  const onToggleTheme = useCallback(() => {
    setThemeMode((m) => (m === "ivory" ? "night" : "ivory"))
  }, [])

  const onTogglePlay = useCallback(() => {
    setPlayState((p) => (p === "playing" ? "paused" : "playing"))
  }, [])

  const onPrev = useCallback(() => {
    selectTrack(currentIndex - 1)
  }, [currentIndex, selectTrack])

  const onNext = useCallback(() => {
    selectTrack(currentIndex + 1)
  }, [currentIndex, selectTrack])

  const onSelect = useCallback(
    (index: number) => {
      selectTrack(index)
    },
    [selectTrack],
  )

  const onBack = useCallback(() => {
    goBackToHome()
  }, [])

  return {
    themeMode,
    playState,
    tracks,
    currentIndex,
    elapsedSec,
    dataSource,
    canvasId: SPECTRUM_CANVAS_ID,
    onToggleTheme,
    onTogglePlay,
    onPrev,
    onNext,
    onSelect,
    onBack,
  }
}
