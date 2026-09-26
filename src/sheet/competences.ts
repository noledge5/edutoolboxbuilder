import { createContext } from 'react';

/** Names of the module's competences (id → name), so tasks can show which one they practise. */
export const CompetenceNamesContext = createContext<Map<string, string>>(new Map());
