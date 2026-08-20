import path from "node:path"
import { defineConfig, type UserConfigExport } from "@tarojs/cli"

const appId = process.env.VIBEX_APP_ID
const hmrWebSocketURL = appId ? `auto://0.0.0.0:0/app-preview/${appId}/ws` : "auto://0.0.0.0:0/ws"
const srcAlias = path.resolve(process.cwd(), "src")

type WebpackChain = { resolve: { alias: { set: (key: string, value: string) => unknown } } }

function aliasWebpackChain(chain: WebpackChain) {
  chain.resolve.alias.set("@", srcAlias)
}

export default defineConfig((): UserConfigExport => ({
  projectName: "vibex-mini-program-app",
  date: "2026-06-24",
  designWidth: 750,
  deviceRatio: {
    640: 2.34 / 2,
    750: 1,
    828: 1.81 / 2,
  },
  sourceRoot: "src",
  outputRoot: `dist/${process.env.TARO_ENV || "h5"}`,
  alias: {
    "@": srcAlias,
  },
  plugins: [
    "@tarojs/plugin-framework-react",
    "@tarojs/plugin-platform-h5",
    "@tarojs/plugin-platform-weapp",
    "@tarojs/plugin-platform-tt",
  ],
  defineConstants: {},
  copy: { patterns: [], options: {} },
  framework: "react",
  compiler: {
    type: "webpack5",
    prebundle: { enable: false },
  },
  cache: { enable: false },
  mini: {
    webpackChain: aliasWebpackChain,
    postcss: {
      pxtransform: { enable: true, config: {} },
      cssModules: {
        enable: false,
        config: { namingPattern: "module", generateScopedName: "[name]__[local]___[hash:base64:5]" },
      },
    },
  },
  h5: {
    publicPath: "/",
    staticDirectory: "static",
    webpackChain: aliasWebpackChain,
    devServer: {
      host: "0.0.0.0",
      port: 8000,
      allowedHosts: "all",
      client: {
        webSocketURL: hmrWebSocketURL,
      },
      proxy: {
        "/__pb": {
          target: "http://127.0.0.1:7000",
          changeOrigin: true,
        },
      },
    },
  },
}))
