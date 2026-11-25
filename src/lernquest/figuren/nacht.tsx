// The evening in the class village (decided 25.11.2026: from 17 to 7 o'clock): every object gets a copy of itself in
// one dark colour laid over it half transparent, so it darkens without gradients or filters (ADR 0001). Lit parts
// (marked `data-licht`: windows, lantern glass, fire) are left out of the copy and drawn again on top. Done per object
// in drawing order, so a house in front still hides the lights of the house behind it.
import { cloneElement, Fragment, isValidElement, type ReactElement, type ReactNode } from "react";

/** The node, its dark copy at `deckung` and its lights on top. */
export function imDunkeln(node: ReactNode, farbe: string, deckung: number): ReactNode {
  const lichter: ReactNode[] = [];
  const kopie = einfarbig(node, farbe, lichter);
  return (
    <>
      {node}
      <g opacity={deckung}>{kopie}</g>
      {lichter}
    </>
  );
}

/** The same shapes in one colour; text is left out, lit parts are collected into `lichter`. */
export function einfarbig(x: ReactNode, farbe: string, lichter: ReactNode[]): ReactNode {
  if (Array.isArray(x)) return x.map((k) => einfarbig(k, farbe, lichter));
  if (!isValidElement(x)) return null;
  const el = x as ReactElement<Record<string, unknown>>;
  const p = el.props;
  if (el.type === Fragment) return <Fragment key={el.key}>{einfarbig(p.children as ReactNode, farbe, lichter)}</Fragment>;
  if (typeof el.type !== "string" || el.type === "text") return null;
  if (p["data-licht"] !== undefined) {
    lichter.push(cloneElement(el, { key: `l${lichter.length}` }));
    return null;
  }
  const neu: Record<string, unknown> = {};
  if (typeof p.fill === "string" && p.fill !== "none") neu.fill = farbe;
  if (typeof p.stroke === "string" && p.stroke !== "none") neu.stroke = farbe;
  const kinder = p.children as ReactNode;
  if (kinder === undefined) return cloneElement(el, neu);
  return Array.isArray(kinder)
    ? cloneElement(el, neu, ...kinder.map((k) => einfarbig(k, farbe, lichter)))
    : cloneElement(el, neu, einfarbig(kinder, farbe, lichter));
}
