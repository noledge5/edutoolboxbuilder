// Pictures of parts uploaded on the teacher page, by part id (object URLs from hochgeladen.tsx). avatar.tsx takes them
// before the built-in pictures; without a provider there are none. The parts made on the teacher page come along
// (`EigeneTeile`): pages that list parts read them, so they show as soon as they are loaded.
import { createContext, useContext } from 'react';
import { alleTeile, type Teil } from '../teile';

export const HochgeladeneBilder = createContext<Record<string, string>>({});
export const EigeneTeile = createContext<Teil[]>([]);
/** Loads pictures and own parts again at once (e.g. a chest gave a part this device does not know yet). */
export const BilderNeuLaden = createContext<() => void>(() => {});

/** All parts (built-in and own); renders again when the own parts change. */
export function useAlleTeile(): Teil[] {
  useContext(EigeneTeile);
  return alleTeile();
}
