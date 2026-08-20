import { StoryView } from "./StoryView"
import { useStory } from "./useStory"
import "./index.css"

export default function StoryPage() {
  const props = useStory()
  return <StoryView {...props} />
}
