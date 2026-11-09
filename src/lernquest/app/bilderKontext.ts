// Pictures of parts uploaded on the teacher page, by part id (object URLs from hochgeladen.tsx). avatar.tsx takes them
// before the built-in pictures; without a provider there are none.
import { createContext } from 'react';

export const HochgeladeneBilder = createContext<Record<string, string>>({});
