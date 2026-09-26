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

/** Lucide icon in the design system's style: stroke 2.75, round caps and joins. */
export function Icon({ icon: I, size = 16 }: { icon: LucideIcon; size?: number }) {
  return <I size={size} strokeWidth={2.75} aria-hidden="true" focusable="false" style={{ display: 'block', flex: 'none' }} />;
}
