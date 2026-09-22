import {
  AudioLines,
  BetweenHorizontalStart,
  BookOpenCheck,
  ChevronDownSquare,
  GalleryHorizontalEnd,
  Image as ImageIcon,
  Images,
  Layers3,
  ListOrdered,
  MessageSquareQuote,
  PanelTop,
  PlaySquare,
  Rows3,
  SeparatorHorizontal,
  Sparkles,
  Table2,
  Text,
  Workflow,
  type LucideIcon,
} from "lucide-react";
import type { AcademyBlockIconKey } from "@/lib/academy-schema";

const icons: Record<AcademyBlockIconKey, LucideIcon> = {
  text: Text,
  quote: MessageSquareQuote,
  callout: Sparkles,
  list: ListOrdered,
  divider: SeparatorHorizontal,
  image: ImageIcon,
  gallery: Images,
  carousel: GalleryHorizontalEnd,
  video: PlaySquare,
  audio: AudioLines,
  resources: BookOpenCheck,
  accordion: ChevronDownSquare,
  tabs: PanelTop,
  flashcards: Layers3,
  process: Workflow,
  table: Table2,
  "worked-example": BetweenHorizontalStart,
  "knowledge-check": Rows3,
};

export default function AcademyBlockIcon({
  name,
  size = 20,
  className,
}: {
  name: AcademyBlockIconKey;
  size?: number;
  className?: string;
}) {
  const Icon = icons[name];
  return <Icon aria-hidden="true" className={className} size={size} />;
}
