import { useState } from "react"
import { Button, Input, Text, View } from "@tarojs/components"
import Taro from "@tarojs/taro"
import { loadApiConfig, saveApiConfig, testApiConnection, type EdenApiConfig } from "@/lib/bridge"
import "./ApiConfigDrawer.css"

export function ApiConfigDrawer(props: { open: boolean; onClose: () => void }) {
  const { open, onClose } = props
  const [config, setConfig] = useState<EdenApiConfig>(loadApiConfig)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ ok?: boolean; message?: string } | null>(null)

  if (!open) return null

  const handleSave = () => {
    saveApiConfig(config)
    Taro.showToast({ title: "API 配置已就绪", icon: "none" })
    onClose()
  }

  const handleTest = async () => {
    setTesting(true)
    setTestResult(null)
    const res = await testApiConnection(config)
    setTesting(false)
    setTestResult(res)
  }

  return (
    <View className="api-drawer-backdrop" onClick={onClose}>
      <View className="api-drawer-sheet" onClick={(e) => e.stopPropagation()}>
        <View className="api-drawer-head">
          <View className="api-drawer-titlebox">
            <Text className="api-drawer-title">API 接口与中枢连接</Text>
            <Text className="api-drawer-sub">LLM & TTS BRIDGE · UNIVERSAL COMPATIBLE</Text>
          </View>
          <View className="api-drawer-close" onClick={onClose}>
            <Text>×</Text>
          </View>
        </View>

        <View className="api-drawer-form">
          <Text className="api-field-label">01 · 接口基地址 BASE URL</Text>
          <Input
            className="api-field-input"
            value={config.baseUrl}
            placeholder="如 https://api.openai.com/v1 或中转站"
            onInput={(e) => setConfig({ ...config, baseUrl: e.detail.value })}
          />

          <Text className="api-field-label">02 · API 密钥 API KEY</Text>
          <Input
            className="api-field-input"
            password
            value={config.apiKey}
            placeholder="sk-..."
            onInput={(e) => setConfig({ ...config, apiKey: e.detail.value })}
          />

          <Text className="api-field-label">03 · 模型名称 MODEL</Text>
          <Input
            className="api-field-input"
            value={config.model}
            placeholder="如 claude-3-5-sonnet, deepseek-chat, gpt-4o"
            onInput={(e) => setConfig({ ...config, model: e.detail.value })}
          />

          <View className="api-toggle-row">
            <View className="api-toggle-label">
              <Text className="api-toggle-name">启用自定义 API 链路</Text>
              <Text className="api-toggle-sub">CONNECT CUSTOM LLM KERNEL</Text>
            </View>
            <View
              className={config.enabled ? "api-switch on" : "api-switch"}
              onClick={() => setConfig({ ...config, enabled: !config.enabled })}
            >
              <Text className="api-switch-state">{config.enabled ? "ON" : "OFF"}</Text>
              <View className="api-switch-knob" />
            </View>
          </View>

          {testResult ? (
            <View className={`api-test-alert ${testResult.ok ? "success" : "error"}`}>
              <Text>{testResult.message}</Text>
            </View>
          ) : null}

          <View className="api-drawer-actions">
            <Button className="api-btn-test" disabled={testing} onClick={handleTest}>
              <Text className="api-btn-test-text">{testing ? "检测中…" : "测试连接 ⚡"}</Text>
            </Button>
            <Button className="api-btn-save" onClick={handleSave}>
              <Text className="api-btn-save-text">保存配置 ↗</Text>
            </Button>
          </View>
        </View>

        <Text className="api-drawer-foot">KEYS STORED LOCALLY ON THIS DEVICE ONLY</Text>
      </View>
    </View>
  )
}
