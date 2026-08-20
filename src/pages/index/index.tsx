import { useEffect } from "react"
import { View, Text } from "@tarojs/components"
import Taro from "@tarojs/taro"
import "./index.css"

export default function Index() {
  useEffect(() => {
    // 自动重定向到主入口（首页开屏仪式）
    Taro.redirectTo({ url: "/pages/home/index" })
  }, [])

  return (
    <View className="eden-portal">
      <View className="portal-ambient" />
      <View className="portal-box">
        <Text className="portal-kicker">// EDEN PRIVATE RESIDENCE</Text>
        <Text className="portal-title">心灵胶囊 · EDEN 47</Text>
        <View className="portal-signal-row">
          <View className="portal-dot" />
          <Text className="portal-signal">ROUTING TO HOME GATEWAY...</Text>
        </View>
      </View>
    </View>
  )
}
