import type { Modifier } from '@dnd-kit/core';
import { getEventCoordinates } from '@dnd-kit/utilities';

/** Places the drag ghost just below-right of the pointer, so it does not hide the drop bar. */
export const ghostBesideCursor: Modifier = ({ activatorEvent, draggingNodeRect, transform }) => {
  if (!activatorEvent || !draggingNodeRect) return transform;
  const at = getEventCoordinates(activatorEvent);
  if (!at) return transform;
  return {
    ...transform,
    x: transform.x + at.x - draggingNodeRect.left + 14,
    y: transform.y + at.y - draggingNodeRect.top + 12,
  };
};
