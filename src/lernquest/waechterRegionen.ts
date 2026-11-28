// Which regions have a guard and which of them a child has beaten (Solo-Boss, 28.11.2026), for the teacher's table.
// A region is a module with at least two unlocked lessons, as on the children's map (the Meilenstein needs two
// stations); the Extra-Pakete are not counted here. `waechter`: the module ids from lq_klassen (daten.waechter).

export function waechterRegionen<M extends { id: string; number: number }>(module: M[], stunden: { id: string; moduleId: string }[], frei: string[]): M[] {
  const offen = new Set(frei);
  return module.filter((m) => stunden.filter((l) => l.moduleId === m.id && offen.has(l.id)).length >= 2).sort((a, b) => a.number - b.number);
}

export const besiegteRegionen = <M extends { id: string }>(regionen: M[], waechter: string[] | undefined): M[] => regionen.filter((m) => waechter?.includes(m.id));
