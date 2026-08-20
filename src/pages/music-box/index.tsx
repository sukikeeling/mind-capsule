import { MusicBoxView } from "./MusicBoxView"
import { useMusicBox } from "./useMusicBox"
import "./index.css"

export default function MusicBoxPage() {
  const props = useMusicBox()
  return <MusicBoxView {...props} />
}
