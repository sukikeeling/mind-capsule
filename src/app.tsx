import type { PropsWithChildren } from "react"
import { EdenProvider, EdenErrorBoundary } from "./context/EdenContext"
import "./app.css"

export default function App({ children }: PropsWithChildren) {
  return (
    <EdenErrorBoundary>
      <EdenProvider>{children}</EdenProvider>
    </EdenErrorBoundary>
  )
}
