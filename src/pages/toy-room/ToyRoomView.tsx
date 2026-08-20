import { Text, View } from "@tarojs/components"
import type { ToyRoomProps } from "./useToyRoom"

/**
 * EDEN 47 · toy-room —— 猫咪桥实况插画
 * 全部为内联 SVG 路径（data-uri）+ CSS 渐变，零位图、零生图。
 * 白昼 / 黑夜各一套配色，靠透明度交叉淡化切换（0.4s 阻尼）。
 */

function svgUri(svg: string): string {
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`
}

/* ---------- 拱桥（viewBox 0 0 670 560，铺满舞台） ---------- */

function bridgeSvg(c: { rail: string; deck: string; body: string; arch: string }): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 670 560">
<g fill="none" stroke="${c.rail}" stroke-width="3" stroke-linecap="round">
<path d="M70,306 C190,222 480,222 600,306"/>
<path d="M70,306 v26 M600,306 v26 M122,278 v26 M187,259 v26 M335,243 v26 M483,259 v26 M548,278 v26" stroke-width="2.2" opacity="0.9"/>
</g>
<path d="M60,332 C190,248 480,248 610,332" fill="none" stroke="${c.deck}" stroke-width="12" stroke-linecap="round"/>
<path d="M60,344 C190,260 480,260 610,344 L610,366 C480,284 190,284 60,366 Z" fill="${c.body}" opacity="0.92"/>
<g fill="none" stroke="${c.arch}" stroke-width="2.4" stroke-linecap="round">
<path d="M60,352 V470 M610,352 V470"/>
<path d="M160,470 C212,378 458,378 510,470"/>
<path d="M30,470 H640" stroke-width="1.4" opacity="0.45" stroke-dasharray="6 9"/>
</g>
</svg>`
}

const BRIDGE_DAY = svgUri(bridgeSvg({ rail: "#1D3B34", deck: "#1D3B34", body: "#EFECE6", arch: "#1D3B34" }))
const BRIDGE_NIGHT = svgUri(
  bridgeSvg({ rail: "rgba(217,212,198,0.92)", deck: "#D9D4C6", body: "#181D24", arch: "rgba(217,212,198,0.72)" }),
)

/* ---------- 猫（共用 viewBox 0 0 160 110，拆身体 / 耳朵 / 尾巴三层各自做动效） ---------- */

function catBodySvg(fill: string, eye: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 110">
<path d="M18,88 C12,64 30,46 60,44 C98,42 126,54 131,76 C134,89 124,98 104,98 L34,98 C24,98 21,95 18,88 Z" fill="${fill}"/>
<circle cx="117" cy="44" r="23" fill="${fill}"/>
<path d="M124,47 q5,4 10,0" fill="none" stroke="${eye}" stroke-width="2" stroke-linecap="round"/>
<path d="M112,98 q8,-5 16,-3" fill="none" stroke="${eye}" stroke-width="2" stroke-linecap="round" opacity="0.5"/>
</svg>`
}

function catEarsSvg(fill: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 110">
<path d="M100,32 L94,8 L114,22 Z" fill="${fill}"/>
<path d="M124,22 L138,6 L140,26 Z" fill="${fill}"/>
</svg>`
}

function catTailSvg(fill: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 110">
<path d="M24,82 C6,74 2,52 16,42 C24,36 34,40 34,50" fill="none" stroke="${fill}" stroke-width="9" stroke-linecap="round"/>
</svg>`
}

const CAT_BODY_DAY = svgUri(catBodySvg("#1D3B34", "#EFECE6"))
const CAT_BODY_NIGHT = svgUri(catBodySvg("#D9D4C6", "#0F1318"))
const CAT_EARS_DAY = svgUri(catEarsSvg("#1D3B34"))
const CAT_EARS_NIGHT = svgUri(catEarsSvg("#D9D4C6"))
const CAT_TAIL_DAY = svgUri(catTailSvg("#1D3B34"))
const CAT_TAIL_NIGHT = svgUri(catTailSvg("#D9D4C6"))

/* ---------- 水波（400 宽正弦线稿瓦片，周期 100，横移一个瓦片无缝循环） ---------- */

function waveSvg(color: string, opacity: number): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 40">
<path d="M0,20 q25,-10 50,0 t50,0 t50,0 t50,0 t50,0 t50,0 t50,0 t50,0" fill="none" stroke="${color}" stroke-width="2.4" stroke-linecap="round" opacity="${opacity}"/>
</svg>`
}

const WAVE_DAY_A = svgUri(waveSvg("#7FB8C7", 0.9))
const WAVE_DAY_B = svgUri(waveSvg("#7FB8C7", 0.55))
const WAVE_DAY_C = svgUri(waveSvg("#7FB8C7", 0.35))
const WAVE_NIGHT_A = svgUri(waveSvg("#FF5E57", 0.5))
const WAVE_NIGHT_B = svgUri(waveSvg("#FF5E57", 0.32))
const WAVE_NIGHT_C = svgUri(waveSvg("#FF5E57", 0.2))

/* ---------- 桥栏小铃铛（viewBox 0 0 44 56） ---------- */

function bellSvg(color: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 44 56">
<g fill="none" stroke="${color}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">
<path d="M22,8 C13,8 9,15 9,24 L9,33 C9,36 6,38 4,40 L40,40 C38,38 35,36 35,33 L35,24 C35,15 31,8 22,8 Z"/>
<path d="M22,8 V4"/>
<circle cx="22" cy="46" r="3.6"/>
</g>
</svg>`
}

const BELL_DAY = svgUri(bellSvg("#1D3B34"))
const BELL_NIGHT = svgUri(bellSvg("rgba(217,212,198,0.92)"))

/* ---------- 黑夜星点 ---------- */

const STARS_ART = svgUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 390 500" preserveAspectRatio="xMidYMin slice">
<g fill="#E7E4DA">
<circle cx="34" cy="84" r="1.6" opacity="0.9"/>
<circle cx="96" cy="42" r="1.1" opacity="0.7"/>
<circle cx="150" cy="120" r="1.3" opacity="0.8"/>
<circle cx="206" cy="60" r="1" opacity="0.6"/>
<circle cx="266" cy="140" r="1.4" opacity="0.85"/>
<circle cx="318" cy="52" r="1.2" opacity="0.7"/>
<circle cx="356" cy="150" r="1.5" opacity="0.9"/>
<circle cx="60" cy="210" r="1.1" opacity="0.6"/>
<circle cx="342" cy="250" r="1.2" opacity="0.65"/>
<circle cx="122" cy="286" r="1" opacity="0.5"/>
<path d="M298,196 l2.4,6 6,2.4 -6,2.4 -2.4,6 -2.4,-6 -6,-2.4 6,-2.4 Z" opacity="0.85"/>
<path d="M74,150 l1.8,4.6 4.6,1.8 -4.6,1.8 -1.8,4.6 -1.8,-4.6 -4.6,-1.8 4.6,-1.8 Z" opacity="0.7"/>
</g>
</svg>`)

/* ---------- 主题交叉淡化小层 ---------- */

function ThemedLayers(props: { day: string; night: string }) {
  return (
    <>
      <View className="tr-theme-day" style={{ backgroundImage: props.day }} />
      <View className="tr-theme-night" style={{ backgroundImage: props.night }} />
    </>
  )
}

export function ToyRoomView(props: ToyRoomProps) {
  const { config, purrCount, bubbles, wagTick, earTick, bellTick, tinkleFlash, onTapCat, onTapBell, onBack } = props

  const night = config.night_mode
  const reduced = config.motion_intensity === "reduced"

  const rootClass = ["toy-room", night ? "night" : "", `grain-${config.grain_level}`, reduced ? "motion-reduced" : ""]
    .filter(Boolean)
    .join(" ")

  return (
    <View className={rootClass}>
      {/* 天光：白昼象牙渐变 / 黑夜深空渐变，交叉淡化 */}
      <View className="tr-sky tr-sky-day" />
      <View className="tr-sky tr-sky-night" />
      <View className="tr-stars-wrap">
        <View className="tr-stars" style={{ backgroundImage: STARS_ART }} />
      </View>

      <View className="tr-fold" />

      {/* 顶部元数据 */}
      <View className="tr-head">
        <View className="tr-head-row">
          <View className="tr-head-left">
            <View className="tr-kicker-row">
              <View className="tr-pulse-dot" />
              <Text className="tr-kicker">SPECIMEN_02B / THE PULSE · KITTY · BRIDGE READY</Text>
            </View>
            <Text className="tr-title">Toy Room · 玩具房</Text>
          </View>
          <View className="tr-menu" onClick={onBack}>
            <Text>‹</Text>
          </View>
        </View>
        <Text className="tr-sub">桥上的猫，一直在等门响</Text>
      </View>

      {/* 桥场景 */}
      <View className="tr-scene">
        <View className="tr-stage">
          <View className="tr-stage-label">
            <Text className="tr-stage-label-text">BRIDGE_047 / LIVE FEED</Text>
          </View>

          {/* 拱桥 */}
          <View className="tr-art tr-bridge">
            <ThemedLayers day={BRIDGE_DAY} night={BRIDGE_NIGHT} />
          </View>

          {/* 桥下水波 */}
          <View className="tr-waves">
            <View className="tr-day-group">
              <View className="tr-wave tr-wave-a" style={{ backgroundImage: WAVE_DAY_A }} />
              <View className="tr-wave tr-wave-b" style={{ backgroundImage: WAVE_DAY_B }} />
              <View className="tr-wave tr-wave-c" style={{ backgroundImage: WAVE_DAY_C }} />
            </View>
            <View className="tr-night-group">
              <View className="tr-wave tr-wave-a" style={{ backgroundImage: WAVE_NIGHT_A }} />
              <View className="tr-wave tr-wave-b" style={{ backgroundImage: WAVE_NIGHT_B }} />
              <View className="tr-wave tr-wave-c" style={{ backgroundImage: WAVE_NIGHT_C }} />
            </View>
          </View>

          {/* 猫：呼吸(身体) + 摇尾 + 抖耳，整块可点 */}
          <View className="tr-cat" onClick={onTapCat}>
            <View className="tr-cat-breath">
              <View
                key={`tail-${wagTick}`}
                className={wagTick > 0 ? "tr-cat-part tr-cat-tail swing" : "tr-cat-part tr-cat-tail"}
              >
                <ThemedLayers day={CAT_TAIL_DAY} night={CAT_TAIL_NIGHT} />
              </View>
              <View className="tr-cat-part tr-cat-body">
                <ThemedLayers day={CAT_BODY_DAY} night={CAT_BODY_NIGHT} />
              </View>
              <View
                key={`ear-${earTick}`}
                className={earTick > 0 ? "tr-cat-part tr-cat-ears twitch" : "tr-cat-part tr-cat-ears"}
              >
                <ThemedLayers day={CAT_EARS_DAY} night={CAT_EARS_NIGHT} />
              </View>
            </View>
          </View>

          {/* 桥栏铃铛 */}
          <View className="tr-bell-hit" onClick={onTapBell}>
            <View key={`bell-${bellTick}`} className={bellTick > 0 ? "tr-bell swing" : "tr-bell"}>
              <ThemedLayers day={BELL_DAY} night={BELL_NIGHT} />
            </View>
          </View>

          {/* 呼噜气泡（同屏最多 2 个） */}
          {bubbles.map((b) => (
            <View key={b.id} className={`tr-bubble ${b.id % 2 === 0 ? "pos-a" : "pos-b"}`}>
              <Text className="tr-bubble-text">{b.text}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* 底部状态行 */}
      <View className="tr-statusbar">
        <Text className={tinkleFlash ? "tr-status flash" : "tr-status"}>
          {tinkleFlash ? "TINKLE RECORDED" : `PULSE LIVE · KITTY ON BRIDGE · 第 ${purrCount} 次呼噜`}
        </Text>
      </View>

      <View className="tr-grain" />
    </View>
  )
}
