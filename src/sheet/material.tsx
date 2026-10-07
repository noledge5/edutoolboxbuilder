// The material number (M1, M2 …) on the sheet. SheetPage (and the student view) provide the numbers of the page.
import { createContext, useContext } from 'react';

export const MaterialNumbersContext = createContext<Map<string, number>>(new Map());

/** "M2" for a block that is a material, else nothing. */
export function MatTag({ id, className = '' }: { id: string; className?: string }) {
  const n = useContext(MaterialNumbersContext).get(id);
  return n ? <span className={'ws-mat ' + className}>M{n}</span> : null;
}

export const useMaterialNumber = (id: string) => useContext(MaterialNumbersContext).get(id) ?? null;
