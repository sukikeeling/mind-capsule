import { CalibrationView } from "./CalibrationView"
import { useCalibration } from "./useCalibration"
import "./index.css"

export default function CalibrationPage() {
  const props = useCalibration()
  return <CalibrationView {...props} />
}
