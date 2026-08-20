import Taro from "@tarojs/taro"

export function goBackToHome() {
  try {
    Taro.navigateBack({
      delta: 1,
      fail: () => {
        Taro.navigateTo({ url: "/pages/home/index" })
      },
    })
  } catch {
    Taro.navigateTo({ url: "/pages/home/index" })
  }
}
