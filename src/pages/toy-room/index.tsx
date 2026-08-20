import { ToyRoomView } from "./ToyRoomView"
import { useToyRoom } from "./useToyRoom"
import "./index.css"

export default function ToyRoomPage() {
  const props = useToyRoom()
  return <ToyRoomView {...props} />
}
