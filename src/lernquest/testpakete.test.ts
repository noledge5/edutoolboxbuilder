// Writes the test stations as JSON (for the server and the play test), only when asked:
// TESTPAKETE_JSON=<datei> npx vitest run src/lernquest/testpakete.test.ts
import { writeFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import { TESTPAKETE } from './testpakete';

const ziel = process.env.TESTPAKETE_JSON;
it.skipIf(!ziel)('writes the test stations as JSON', () => {
  writeFileSync(ziel!, JSON.stringify(TESTPAKETE));
  expect(TESTPAKETE).toHaveLength(2);
});
