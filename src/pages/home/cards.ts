/**
 * EDEN 47 归家索引 · 标本卡牌数据与内联 SVG 插画
 * 所有插画均为矢量路径 + CSS 渐变绘制，无外部位图、无生图接口。
 * 严格对齐 README 规范（I ~ VI 完整罗盘体系）
 */

export interface SpecimenCard {
  id: string
  roman: string
  metaLines: string[]
  enSub: string
  title: string
  tags: string
  /** 插画 data-uri（url("data:image/svg+xml,...")） */
  art: string
  /** 插画层 CSS 渐变（与 art 叠加为多层 background-image） */
  artGradients: string
  artSize: string
  /** 元数据文字颜色方案 */
  metaTheme: "light" | "dark"
}

function svgUri(svg: string): string {
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`
}

/* ---------- 卡牌 I · 兰花白描（羊皮纸温润白） ---------- */
const orchidSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 440">
<defs><g id="o" fill="none" stroke="#8f897b" stroke-width="1.4">
<path d="M0,-30 C9,-20 9,-7 0,-1 C-9,-7 -9,-20 0,-30"/>
<path d="M-3,-6 C-18,-14 -32,-8 -31,4 C-24,13 -9,10 -2,1"/>
<path d="M3,-6 C18,-14 32,-8 31,4 C24,13 9,10 2,1"/>
<path d="M0,0 C-9,8 -8,20 0,26 C8,20 9,8 0,0"/>
<circle r="3.2" cy="-2"/></g></defs>
<g fill="none" stroke="#8f897b" stroke-width="1.3" opacity="0.8">
<path d="M150,436 C142,360 158,320 148,268 C141,228 162,190 186,150 C198,130 210,112 224,96"/>
<path d="M148,268 C132,246 118,238 100,232"/>
<path d="M186,150 C170,140 158,138 142,138"/>
<path d="M150,436 C160,400 176,384 196,376"/>
<path d="M150,436 C118,410 94,404 68,410 C92,428 122,438 150,436"/>
<path d="M150,436 C182,408 210,402 234,410 C212,428 182,438 150,436"/>
<path d="M148,432 C124,420 104,414 84,412"/>
<path d="M152,432 C178,418 200,412 220,412"/></g>
<use href="#o" transform="translate(150,238) rotate(-8)"/>
<use href="#o" transform="translate(110,262) rotate(14) scale(0.92)"/>
<use href="#o" transform="translate(178,196) rotate(-20) scale(0.9)"/>
<use href="#o" transform="translate(146,158) rotate(6) scale(0.8)"/>
<use href="#o" transform="translate(196,120) rotate(-14) scale(0.72)"/>
<use href="#o" transform="translate(226,94) rotate(-30) scale(0.6)"/>
<g fill="none" stroke="#8f897b" stroke-width="1.1" opacity="0.7">
<circle cx="240" cy="76" r="4"/><circle cx="250" cy="62" r="3"/><circle cx="92" cy="226" r="4"/>
</g>
</svg>`

/* ---------- 卡牌 II · 木兰星轨（深海紫红星云） ---------- */
const magnoliaSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 440">
<defs>
<radialGradient id="n1" cx="50%" cy="50%" r="50%">
<stop offset="0%" stop-color="#FF5E57" stop-opacity="0.55"/>
<stop offset="55%" stop-color="#A63A40" stop-opacity="0.25"/>
<stop offset="100%" stop-color="#A63A40" stop-opacity="0"/>
</radialGradient>
<g id="m" fill="none" stroke="#F4EFE6" stroke-width="1.2">
<path d="M0,0 C3,-12 2,-24 0,-32 C-2,-24 -3,-12 0,0"/>
<path d="M0,0 C3,-12 2,-24 0,-32 C-2,-24 -3,-12 0,0" transform="rotate(60)"/>
<path d="M0,0 C3,-12 2,-24 0,-32 C-2,-24 -3,-12 0,0" transform="rotate(120)"/>
<path d="M0,0 C3,-12 2,-24 0,-32 C-2,-24 -3,-12 0,0" transform="rotate(180)"/>
<path d="M0,0 C3,-12 2,-24 0,-32 C-2,-24 -3,-12 0,0" transform="rotate(240)"/>
<path d="M0,0 C3,-12 2,-24 0,-32 C-2,-24 -3,-12 0,0" transform="rotate(300)"/>
<circle r="2.4"/></g></defs>
<ellipse cx="150" cy="200" rx="92" ry="160" fill="url(#n1)" transform="rotate(18 150 200)"/>
<ellipse cx="196" cy="140" rx="60" ry="110" fill="url(#n1)" transform="rotate(-16 196 140)" opacity="0.8"/>
<ellipse cx="104" cy="280" rx="52" ry="96" fill="url(#n1)" transform="rotate(24 104 280)" opacity="0.6"/>
<g fill="#F4EFE6">
<circle cx="36" cy="60" r="1.4" opacity="0.8"/><circle cx="70" cy="120" r="1" opacity="0.5"/>
<circle cx="252" cy="84" r="1.5" opacity="0.9"/><circle cx="268" cy="180" r="1" opacity="0.5"/>
<circle cx="232" cy="300" r="1.3" opacity="0.7"/><circle cx="48" cy="330" r="1" opacity="0.5"/>
<circle cx="120" cy="48" r="1.2" opacity="0.7"/><circle cx="204" cy="40" r="1" opacity="0.6"/>
<circle cx="28" cy="200" r="1.2" opacity="0.6"/><circle cx="272" cy="368" r="1" opacity="0.5"/>
<circle cx="96" cy="396" r="1.2" opacity="0.6"/><circle cx="188" cy="352" r="1" opacity="0.4"/>
</g>
<g fill="none" stroke="#F4EFE6" stroke-width="1.3" opacity="0.95">
<path d="M152,424 C146,352 152,308 142,258 C134,216 150,176 148,128 C147,100 152,76 160,54"/>
<path d="M142,258 C124,244 112,240 96,238"/>
<path d="M148,128 C164,116 176,112 192,110"/>
<path d="M150,320 C168,308 180,306 196,306"/></g>
<use href="#m" transform="translate(160,52) scale(1.05)"/>
<use href="#m" transform="translate(94,236) rotate(-24) scale(0.9)"/>
<use href="#m" transform="translate(194,108) rotate(18) scale(0.85)"/>
<use href="#m" transform="translate(198,304) rotate(40) scale(0.7)"/>
<g fill="none" stroke="#F4EFE6" stroke-width="1.1" opacity="0.8">
<path d="M148,180 C142,170 142,162 146,154"/><circle cx="147" cy="150" r="3"/>
<path d="M144,292 C150,282 152,274 150,266"/><circle cx="150" cy="262" r="3"/>
</g>
</svg>`

/* ---------- 卡牌 III · 古典茶花铜版画（黑曜石深空） ---------- */
const obsidianCamelliaSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 440">
<defs>
<radialGradient id="obsidianGlow" cx="50%" cy="45%" r="55%">
<stop offset="0%" stop-color="#7FB8C7" stop-opacity="0.25"/>
<stop offset="60%" stop-color="#22303C" stop-opacity="0.1"/>
<stop offset="100%" stop-color="#000000" stop-opacity="0"/>
</radialGradient>
<g id="leaf" fill="none" stroke="#7FB8C7" stroke-width="1.3" opacity="0.75">
<path d="M0,0 C12,-10 30,-13 46,-6 C34,7 14,10 0,0 Z"/>
<path d="M4,-1 L40,-6 M8,2 L38,-2 M10,-4 L36,-9 M12,4 L32,1 M14,-6 L32,-12" stroke-width="0.7" opacity="0.8"/>
</g>
<g id="bloom" fill="none" stroke="#EDEAE0" stroke-width="1.5">
<path d="M0,-26 C14,-22 22,-10 18,4 C10,16 -10,16 -18,4 C-22,-10 -14,-22 0,-26 Z"/>
<path d="M0,-26 C6,-14 6,-2 0,6 M-18,4 C-8,0 8,0 18,4 M-12,-18 C-4,-10 4,-10 12,-18" stroke-width="0.8" opacity="0.85"/>
<path d="M0,-6 C-4,-2 -4,4 0,7 C4,4 4,-2 0,-6" stroke-width="1"/>
<g stroke-width="0.9" stroke="#E3B377">
<path d="M0,-6 L0,-14 M-4,-4 L-9,-10 M4,-4 L9,-10 M-5,0 L-12,-2 M5,0 L12,-2"/>
<circle cx="0" cy="-15" r="1.4" fill="#E3B377"/>
<circle cx="-10" cy="-11" r="1.4" fill="#E3B377"/>
<circle cx="10" cy="-11" r="1.4" fill="#E3B377"/>
<circle cx="-13" cy="-2" r="1.4" fill="#E3B377"/>
<circle cx="13" cy="-2" r="1.4" fill="#E3B377"/>
</g>
</g>
<g id="bud" fill="none" stroke="#EDEAE0" stroke-width="1.3" opacity="0.85">
<circle r="7"/>
<circle r="10" stroke="#7FB8C7" opacity="0.55"/>
<path d="M0,10 L0,20"/>
</g>
</defs>
<rect x="0" y="0" width="300" height="440" fill="url(#obsidianGlow)"/>
<g opacity="0.35">
<circle cx="150" cy="208" r="88" fill="none" stroke="#7FB8C7" stroke-width="0.6" stroke-dasharray="3 5"/>
<circle cx="150" cy="208" r="124" fill="none" stroke="#EDEAE0" stroke-width="0.6" stroke-dasharray="2 6"/>
</g>
<use href="#leaf" transform="translate(150,220) rotate(-160) scale(1.25)"/>
<use href="#leaf" transform="translate(150,220) rotate(-120) scale(1.35)"/>
<use href="#leaf" transform="translate(150,220) rotate(-70) scale(1.3)"/>
<use href="#leaf" transform="translate(150,220) rotate(-25) scale(1.4)"/>
<use href="#leaf" transform="translate(150,220) rotate(15) scale(1.3)"/>
<use href="#leaf" transform="translate(150,220) rotate(60) scale(1.35)"/>
<use href="#leaf" transform="translate(150,220) rotate(105) scale(1.25)"/>
<use href="#leaf" transform="translate(150,220) rotate(150) scale(1.2)"/>
<use href="#bloom" transform="translate(150,208) scale(1.5)"/>
<use href="#bloom" transform="translate(104,164) rotate(-18) scale(0.95)"/>
<use href="#bloom" transform="translate(196,160) rotate(16) scale(0.9)"/>
<use href="#bud" transform="translate(216,120)"/>
<use href="#bud" transform="translate(232,146) scale(0.8)"/>
<use href="#bud" transform="translate(86,124) scale(0.85)"/>
</svg>`

/* ---------- 卡牌 IV · 故事场景航海地图（翡翠暗绿） ---------- */
const mapSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 440">
<g fill="none" stroke="#EDEAE0" opacity="0.32" stroke-width="1">
<path d="M28,120 C70,88 132,84 176,108 C216,130 248,126 274,110"/>
<path d="M20,168 C66,132 138,128 186,154 C226,176 256,170 282,156"/>
<path d="M24,352 C64,326 118,322 158,342 C200,362 240,358 276,342"/>
<path d="M18,398 C62,374 122,370 168,390 C210,408 250,404 284,388"/></g>
<path d="M60,100 C110,130 210,130 240,200 C270,270 170,300 130,370" fill="none" stroke="#EDEAE0" stroke-width="1.8" stroke-dasharray="4 6" opacity="0.9"/>
<g fill="#EDEAE0">
<circle cx="60" cy="100" r="3.5"/><circle cx="240" cy="200" r="3.5"/><circle cx="130" cy="370" r="4.5"/>
</g>
<g transform="translate(224,96)" fill="none" stroke="#EDEAE0" stroke-width="1" opacity="0.8">
<circle cx="0" cy="0" r="22"/><circle cx="0" cy="0" r="26" stroke-dasharray="2 3"/>
<path d="M0,-24 L0,24 M-24,0 L24,0"/><path d="M0,-22 L3,-10 L-3,-10 Z" fill="#EDEAE0"/>
</g>
<g transform="translate(130,370) translate(0,-16)" fill="none" stroke="#EDEAE0" stroke-width="1.2">
<path d="M0,0 v16 M0,0 l9,4 l-9,4 Z" fill="#EDEAE0"/>
</g>
</svg>`

/* ---------- 卡牌 V · 猫咪拱桥（暖调红褐） ---------- */
const catBridgeSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 440">
<g fill="none" stroke="#EDEAE0" stroke-width="1.4" opacity="0.85">
<path d="M30,240 C90,170 210,170 270,240"/>
<path d="M30,240 v18 M270,240 v18 M60,222 v18 M102,204 v18 M150,196 v18 M198,204 v18 M240,222 v18"/>
</g>
<path d="M24,258 C90,188 210,188 276,258" fill="none" stroke="#EDEAE0" stroke-width="7" opacity="0.95"/>
<g fill="none" stroke="#EDEAE0" stroke-width="1.2" opacity="0.6">
<path d="M20,330 C80,314 130,314 180,330 C230,346 260,344 280,330" stroke-dasharray="3 5"/>
<path d="M20,358 C80,342 130,342 180,358 C230,374 260,372 280,358" stroke-dasharray="3 5"/>
</g>
<g transform="translate(130,158) scale(0.9)">
<path d="M10,38 C6,24 16,14 32,13 C52,12 66,18 69,30 C71,38 65,43 54,43 L18,43 C13,43 11,41 10,38 Z" fill="#EDEAE0"/>
<circle cx="62" cy="13" r="12" fill="#EDEAE0"/>
<path d="M52,6 L48,-4 L60,2 Z" fill="#EDEAE0"/>
<path d="M66,2 L74,-5 L75,5 Z" fill="#EDEAE0"/>
<path d="M12,35 C2,30 0,18 7,12 C12,8 18,10 18,16" fill="none" stroke="#EDEAE0" stroke-width="4.5" stroke-linecap="round"/>
</g>
</svg>`

/* ---------- 卡牌 VI · 刻度盘白描（复古灰白） ---------- */
const dialSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 440">
<g fill="none" stroke="#2B443B" stroke-width="1.3" opacity="0.8">
<circle cx="150" cy="220" r="92"/>
<circle cx="150" cy="220" r="76" stroke-dasharray="2 4"/>
<circle cx="150" cy="220" r="54"/>
<circle cx="150" cy="220" r="6" fill="#2B443B"/>
<path d="M150,128 V108 M150,312 V332 M58,220 H38 M242,220 H262"/>
<path d="M150,220 L198,164" stroke-width="2"/>
<path d="M150,220 L112,256" stroke-width="1.4"/>
</g>
<g fill="#2B443B" opacity="0.75">
<circle cx="150" cy="116" r="3"/><circle cx="150" cy="324" r="3"/><circle cx="46" cy="220" r="3"/><circle cx="254" cy="220" r="3"/>
</g>
</svg>`

/* ---------- 仪式卡插画 ---------- */
export const ritualBaseArt = svgUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 400">
<rect width="240" height="400" fill="#1B2B24"/>
<g fill="none" stroke="#EDEAE0" opacity="0.14" stroke-width="1">
<circle cx="120" cy="180" r="80"/><circle cx="120" cy="180" r="120"/>
<path d="M60,340 C68,290 58,250 70,204 C78,172 70,140 80,112"/>
<path d="M70,204 C56,192 48,188 38,186"/>
<path d="M180,340 C172,290 182,250 170,204 C162,172 170,140 160,112"/>
<path d="M170,204 C184,192 192,188 202,186"/>
</g>
<path d="M24,300 H216" stroke="#EDEAE0" stroke-width="0.8" opacity="0.35"/>
<path d="M95,294 V306 M145,294 V306" stroke="#EDEAE0" stroke-width="0.8" opacity="0.5"/>
</svg>`)

export const ritualDoorArt = svgUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 400">
<rect x="72" y="96" width="47" height="196" fill="#EFECE6"/>
<rect x="121" y="96" width="47" height="196" fill="#2B443B"/>
<rect x="72" y="96" width="96" height="196" fill="none" stroke="#EDEAE0" stroke-width="1" opacity="0.55"/>
</svg>`)

export const ritualFigureArt = svgUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 400">
<circle cx="95" cy="176" r="10" fill="#8FA79B"/>
<path d="M95,186 L84,268 L106,268 Z" fill="#8FA79B"/>
<circle cx="145" cy="176" r="10" fill="#B9BFBA"/>
<path d="M145,186 L134,268 L156,268 Z" fill="#B9BFBA"/>
</svg>`)

export const SPECIMEN_CARDS: SpecimenCard[] = [
  {
    id: "baink",
    roman: "I",
    metaLines: ["SPECIMEN_16A", "ARGENT / HOME"],
    enSub: "THE COMPANION · I",
    title: "Baink",
    tags: "HOME · CHAT · WORKBENCH",
    art: svgUri(orchidSvg),
    artGradients: "linear-gradient(180deg, #F3F0E9 0%, #EAE5DA 46%, #F3F0E9 100%)",
    artSize: "82% auto",
    metaTheme: "dark",
  },
  {
    id: "music-box",
    roman: "II",
    metaLines: ["SPECIMEN_10A", "WINE / SIGNAL"],
    enSub: "DOMESTIC RADIO · II",
    title: "音乐盒",
    tags: "SIGNAL · NOW PLAYING",
    art: svgUri(magnoliaSvg),
    artGradients: "radial-gradient(120% 90% at 50% 30%, #1B202B 0%, #12151C 58%, #0D1015 100%)",
    artSize: "cover",
    metaTheme: "light",
  },
  {
    id: "archive",
    roman: "III",
    metaLines: ["ARCHIVE FILE", "SPECIMEN_08A", "OBSIDIAN / ARCHIVE"],
    enSub: "SHARED ARCHIVE · III",
    title: "共同记忆",
    tags: "OBSIDIAN · SHARED ARCHIVE",
    art: svgUri(obsidianCamelliaSvg),
    artGradients: "radial-gradient(130% 100% at 50% 25%, #1d232c 0%, #12151b 58%, #0a0c0f 100%)",
    artSize: "cover",
    metaTheme: "light",
  },
  {
    id: "story",
    roman: "IV",
    metaLines: ["SPECIMEN_14B", "PATH / FIELD NOTE"],
    enSub: "THE PATH · IV",
    title: "Story",
    tags: "MAP · CONTINUE SCENE",
    art: svgUri(mapSvg),
    artGradients: "linear-gradient(165deg, #33544A 0%, #24403A 46%, #14211D 100%)",
    artSize: "cover",
    metaTheme: "light",
  },
  {
    id: "toy-room",
    roman: "V",
    metaLines: ["SPECIMEN_02B", "PULSE / LIVE"],
    enSub: "KITTY BRIDGE · V",
    title: "玩具房",
    tags: "KITTY · BRIDGE READY",
    art: svgUri(catBridgeSvg),
    artGradients: "linear-gradient(170deg, #4A2B33 0%, #3A2129 52%, #241620 100%)",
    artSize: "cover",
    metaTheme: "light",
  },
  {
    id: "calibration",
    roman: "VI",
    metaLines: ["SPECIMEN_04A", "DIAL / SYSTEM"],
    enSub: "HOUSE CALIBRATION · VI",
    title: "设置",
    tags: "SYSTEM · HOUSE TUNING",
    art: svgUri(dialSvg),
    artGradients: "linear-gradient(180deg, #EFECE6 0%, #E5E1D7 55%, #EFECE6 100%)",
    artSize: "80% auto",
    metaTheme: "dark",
  },
]
