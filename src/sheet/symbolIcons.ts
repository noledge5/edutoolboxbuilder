// The pictures of the symbol system (src/sheet/symbols.ts): plain line icons, one stroke, readable on a black-and-white
// copy at 16 px. Lucide where it has the right picture; three people for the group drawn in the same style.
import { BookOpen, Calculator, Ear, Highlighter, ListOrdered, MessagesSquare, PencilRuler, PenLine, Presentation, Search, Spline, SquareCheck, Table2, TextCursorInput, User, Users, createLucideIcon, type LucideIcon } from 'lucide-react';
import type { FormKey, SymKey } from './symbols';

const UsersThree = createLucideIcon('users-three', [
  ['circle', { cx: '12', cy: '7', r: '3', key: 'a' }],
  ['path', { d: 'M6.5 20v-1.5a5.5 5.5 0 0 1 11 0V20', key: 'b' }],
  ['circle', { cx: '4.5', cy: '9.5', r: '2', key: 'c' }],
  ['path', { d: 'M1.5 18.5v-.5a3.5 3.5 0 0 1 4.2-3.4', key: 'd' }],
  ['circle', { cx: '19.5', cy: '9.5', r: '2', key: 'e' }],
  ['path', { d: 'M22.5 18.5v-.5a3.5 3.5 0 0 0-4.2-3.4', key: 'f' }],
]);

export const SYMBOL_ICONS: Record<SymKey, LucideIcon> = {
  lesen: BookOpen,
  markieren: Highlighter,
  schreiben: PenLine,
  ankreuzen: SquareCheck,
  ergaenzen: TextCursorInput,
  zuordnen: Spline,
  ordnen: ListOrdered,
  eintragen: Table2,
  zeichnen: PencilRuler,
  rechnen: Calculator,
  sprechen: MessagesSquare,
  hoeren: Ear,
  recherchieren: Search,
};

export const FORM_ICONS: Record<FormKey, LucideIcon> = {
  allein: User,
  partner: Users,
  gruppe: UsersThree,
  klasse: Presentation,
};
