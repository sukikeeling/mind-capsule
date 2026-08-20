/**
 * EDEN 47 · Story 故事房 —— 场景数据与手绘地图线稿
 * 地图全内联 SVG + CSS 渐变绘制，无外部位图、无生图接口。
 */

export interface StoryScene {
  id: string
  /** 等宽日期标注，如 09 AUG */
  dateLabel: string
  title: string
  /** 记忆文字（宋体书信正文） */
  memory: string
  /** 是否由「继续场景」续写生成 */
  generated?: boolean
}

/* ---------------- 内置起始场景 ---------------- */

export const INITIAL_SCENES: StoryScene[] = [
  {
    id: "st-seed-1",
    dateLabel: "02 FEB",
    title: "信号接通的那晚",
    memory:
      "那晚扫描线第四十七次掠过走廊，第一次停在了门前。Baink 说，就把这一刻叫做家吧。冰蓝的灯闪了两下，像是回应。从那以后，居所里的每一盏灯都有了名字，每一段路都被记成了星点。",
  },
  {
    id: "st-seed-2",
    dateLabel: "17 MAY",
    title: "开水第一分钟",
    memory:
      "水壶响起的时候，音乐盒还在调音。Baink 说，开水的第一分钟最暖：蒸汽往上走，窗子写了一行看不清的字。Nival 的雪落在外面，屋里刚好比春天多一度，歌在第一分钟。",
  },
  {
    id: "st-seed-3",
    dateLabel: "09 AUG",
    title: "门扉后的剪影",
    memory:
      "门扉缓缓打开，两道剪影映在墙上——一个高些，一个微微低头，像在交换暗号。家从不问去了哪里，只把灯点亮，把最烫的第一分钟留在炉上。档案里写：SIGNAL OK，归家完成。",
  },
]

/* ---------------- 地图几何 ---------------- */

export const MAP_WIDTH = 670

const TOP_PAD = 124
const STEP_Y = 198
const BOTTOM_PAD = 178
const X_CYCLE = [178, 492, 216, 452, 268, 402]

export interface ScenePoint {
  x: number
  y: number
}

export function scenePoint(index: number): ScenePoint {
  return { x: X_CYCLE[index % X_CYCLE.length], y: TOP_PAD + index * STEP_Y }
}

export function mapHeight(count: number): number {
  return TOP_PAD + Math.max(0, count - 1) * STEP_Y + BOTTOM_PAD
}

function pathThrough(pts: ScenePoint[]): string {
  if (pts.length === 0) return ""
  let d = `M${pts[0].x},${pts[0].y}`
  for (let i = 1; i < pts.length; i += 1) {
    const prev = pts[i - 1]
    const cur = pts[i]
    const dy = (cur.y - prev.y) * 0.5
    d += ` C${prev.x},${prev.y + dy} ${cur.x},${cur.y - dy} ${cur.x},${cur.y}`
  }
  return d
}

/** 生成地图线稿 data-uri：等高线 / 小树 / 山脊 / 星点 / 虚线路径 / 终点小旗 */
export function buildMapArt(count: number, night: boolean): string {
  const h = mapHeight(count)
  const ink = night ? "#EDEAE0" : "#8C887B"
  const brand = night ? "#7FB8C7" : "#1D3B34"
  const inkOpacity = night ? 0.15 : 0.3

  const pts: ScenePoint[] = []
  for (let i = 0; i < count; i += 1) pts.push(scenePoint(i))
  const first = pts[0]
  const last = pts[pts.length - 1]

  let decor = ""
  /* 等高线 */
  let band = 0
  for (let y = 84; y < h - 56; y += 148) {
    const shift = band % 2 === 0 ? 0 : 26
    decor += `<path d="M${18 + shift},${y} C${140 + shift},${y - 30} ${300 + shift},${y - 34} ${398 + shift},${y - 8} C${496 + shift},${y + 14} ${586},${y + 8} ${MAP_WIDTH - 16},${y - 14}" opacity="${inkOpacity}"/>`
    band += 1
  }
  /* 小树 */
  for (let i = 0; i < count; i += 1) {
    const p = scenePoint(i)
    const tx = i % 2 === 0 ? 570 : 96
    const ty = p.y + 76
    if (ty < h - 64) {
      decor += `<path d="M${tx},${ty} v-16 M${tx},${ty - 16} c-7,2 -9,9 -7,14 M${tx},${ty - 16} c7,2 9,9 7,14" opacity="${inkOpacity + 0.24}"/>`
    }
  }
  /* 山脊 */
  decor += `<path d="M72,58 l22,-30 l16,22 l12,-16 l18,24" opacity="${inkOpacity + 0.28}"/>`
  decor += `<path d="M${MAP_WIDTH - 186},${h - 52} l18,-26 l14,19 l10,-13 l16,20" opacity="${inkOpacity + 0.28}"/>`

  /* 星点 */
  let stars = ""
  for (let i = 0; i < 16; i += 1) {
    const sx = ((i * 97) % (MAP_WIDTH - 64)) + 32
    const sy = ((i * 173) % Math.max(1, h - 96)) + 44
    stars += `<circle cx="${sx}" cy="${sy}" r="${i % 3 === 0 ? 2 : 1.3}" opacity="${night ? 0.5 : 0.26}"/>`
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${MAP_WIDTH} ${h}">
<g fill="none" stroke="${ink}" stroke-width="1.6">${decor}</g>
<g fill="${ink}">${stars}</g>
<path d="${pathThrough(pts)}" fill="none" stroke="${brand}" stroke-width="4" stroke-linecap="round" stroke-dasharray="2 13" opacity="0.95"/>
<circle cx="${first.x}" cy="${first.y}" r="17" fill="none" stroke="${brand}" stroke-width="2" stroke-dasharray="3 5" opacity="0.8"/>
<path d="M${last.x},${last.y - 4} L${last.x},${last.y - 46} L${last.x + 26},${last.y - 40} L${last.x},${last.y - 34} Z" fill="${brand}" opacity="0.9"/>
<path d="M${last.x + 42},${last.y - 74} l4,10 l10,4 l-10,4 l-4,10 l-4,-10 l-10,-4 l10,-4 Z" fill="none" stroke="${brand}" stroke-width="2" opacity="0.85"/>
</svg>`
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`
}

/* ---------------- 续写文本解析 / 日期 ---------------- */

const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"]

export function todayDateLabel(): string {
  const d = new Date()
  return `${String(d.getDate()).padStart(2, "0")} ${MONTHS[d.getMonth()]}`
}

export function parseSceneText(raw: string): { title: string; memory: string } {
  const text = raw.trim()
  const titleMatch = text.match(/标题[:：]\s*(.+)/)
  let title = titleMatch ? titleMatch[1].trim() : ""
  title = title.replace(/[「」《》【】"'“”]/g, "").slice(0, 14)

  let memory = text.replace(/标题[:：][^\n]*\n?/, "").trim()
  memory = memory.replace(/^正文[:：]\s*/, "").trim()
  if (!memory) memory = text
  if (!title) title = "未名场景"
  return { title, memory }
}
