import { ArchiveView } from "./ArchiveView"
import { useArchive } from "./useArchive"
import "./index.css"

export default function ArchivePage() {
  const props = useArchive()
  return <ArchiveView {...props} />
}
