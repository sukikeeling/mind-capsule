import path from "node:path"
import { defineConfig, type UserConfigExport } from "@tarojs/cli"

const appId = process.env.VIBEX_APP_ID
const hmrWebSocketURL = appId ? `auto://0.0.0.0:0/app-preview/${appId}/ws` : "auto://0.0.0.0:0/ws"
const srcAlias = path.resolve(process.cwd(), "src")

type WebpackChain = {
  resolve: { alias: { set: (key: string, value: string) => unknown } }
  optimization: {
    minimizers: { has: (key: string) => boolean }
    minimizer: (
      name: string,
    ) => {
      tap: (fn: (args: Array<Record<string, unknown>>) => Array<Record<string, unknown>>) => unknown
    }
  }
}

function aliasWebpackChain(rawChain: unknown) {
  const chain = rawChain as WebpackChain
  chain.resolve.alias.set("@", srcAlias)
  // 容器 cgroup 内存限额 2 GiB：Taro 默认 CSS 压缩 parallel: true 按核数（40）起
  // 数十个 worker，生产构建必然在 asset processing 阶段 OOM 被杀。
  // 把 runner 注册的 cssoWebpackPlugin 并行度压到 2，其余参数保持默认。
  // dev/watch 模式不开压缩、该 minimizer 未注册，必须先 has 守卫再 tap。
  if (chain.optimization.minimizers.has("cssoWebpackPlugin")) {
    chain.optimization
      .minimizer("cssoWebpackPlugin")
      .tap((args) => args.map((opt) => ({ ...opt, parallel: 2 })))
  }
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
      host: "127.0.0.1",
      port: 5176,
      allowedHosts: "all",
      client: {
        webSocketURL: hmrWebSocketURL,
      },
      proxy: {
        // 本地预览补齐网关行为：剥离 /__pb 前缀后再转发到 PocketBase
        "/__pb": {
          target: "http://127.0.0.1:7000",
          changeOrigin: true,
          pathRewrite: { "^/__pb": "" },
        },
      },
    },
  },
}))
