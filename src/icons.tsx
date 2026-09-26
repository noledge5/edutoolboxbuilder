import {
  AlignLeft,
  ArrowLeftRight,
  Brush,
  Heading,
  Image,
  Info,
  Lightbulb,
  ListChecks,
  PencilLine,
  Table,
  Tag,
  TextCursorInput,
  ThermometerSun,
  Workflow,
  type LucideIcon,
} from 'lucide-react';
import type { BlockType } from './model/types';

export const BLOCK_ICONS: Record<BlockType, LucideIcon> = {
  heading: Heading,
  text: AlignLeft,
  hint: Info,
  merksatz: Lightbulb,
  wordbank: Tag,
  image: Image,
  flow: Workflow,
  open: PencilLine,
  mc: ListChecks,
  gap: TextCursorInput,
  table: Table,
  match: ArrowLeftRight,
  draw: Brush,
};

/** Topic icon of the document. One icon per overarching topic; fixed until the library adds a picker. */
export const TOPIC_ICON: LucideIcon = ThermometerSun;

/** Lucide icon in the design system's style: stroke 2.75, round caps and joins. */
export function Icon({ icon: I, size = 16 }: { icon: LucideIcon; size?: number }) {
  return <I size={size} strokeWidth={2.75} aria-hidden="true" focusable="false" style={{ display: 'block', flex: 'none' }} />;
}
