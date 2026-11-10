// Pictures of parts uploaded on the teacher page, by part id (object URLs from hochgeladen.tsx). avatar.tsx takes them
// before the built-in pictures; without a provider there are none. The parts made on the teacher page come along
// (`EigeneTeile`): pages that list parts read them, so they show as soon as they are loaded.
import { createContext, useContext } from 'react';
import { alleFrisuren, alleTeile, type Frisur, type Teil } from '../teile';

export const HochgeladeneBilder = createContext<Record<string, string>>({});
export const EigeneTeile = createContext<Teil[]>([]);
export const EigeneFrisuren = createContext<Frisur[]>([]);
/** The teacher page's preview of a hair not in the list yet (a new one): every hero below wears it. */
export const FrisurVorschau = createContext<string | undefined>(undefined);
/** Loads pictures and own parts again at once (e.g. a chest gave a part this device does not know yet). */
export const BilderNeuLaden = createContext<() => void>(() => {});

/** All parts (built-in and own); renders again when the own parts change. */
export function useAlleTeile(): Teil[] {
  useContext(EigeneTeile);
  return alleTeile();
}

/** All hair (built-in and own); renders again when the own hair changes. */
export function useAlleFrisuren(): Frisur[] {
  useContext(EigeneFrisuren);
  return alleFrisuren();
}
