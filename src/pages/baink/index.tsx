import { BainkView } from "./BainkView"
import { useBaink } from "./useBaink"
import "./index.css"

export default function BainkPage() {
  const props = useBaink()
  return <BainkView {...props} />
}
