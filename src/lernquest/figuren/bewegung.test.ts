// The motion engine's smoothness: a curve through the keyframes, lagging tracks, per-segment curves and blends.
import { describe, expect, it } from 'vitest';
import { ANIMATIONEN } from './animationen';
import { abtasten, mischeStellungen, spurPhase, stellung } from './bewegung';
import type { Animation } from './typen';

const ende: Pick<Animation, 'wiederholen'> = { wiederholen: 1 };
const wert = (drehen: number[], t: number, a: Partial<Animation> = ende) => abtasten({ drehen }, a, t).drehen;
const tempo = (drehen: number[], t: number, a: Partial<Animation> = ende) => (wert(drehen, t + 1e-4, a) - wert(drehen, t - 1e-4, a)) / 2e-4;

describe('curve through the keyframes (weich)', () => {
  it('passes through a keyframe without stopping', () => {
    // 0 → 10 → 20: the old curve stopped at 10; now it keeps the average speed there
    expect(tempo([0, 10, 20], 0.5)).toBeGreaterThan(15);
  });

  it('rests where a value turns round, and never overshoots a keyframe', () => {
    expect(Math.abs(tempo([0, 10, 0], 0.5))).toBeLessThan(0.5);
    for (let t = 0; t <= 1; t += 0.01) expect(wert([0, 10, 0], t)).toBeLessThanOrEqual(10 + 1e-9);
    for (let t = 0; t <= 1; t += 0.01) expect(wert([0, 4, 20, 20, 0], t)).toBeLessThanOrEqual(20 + 1e-9);
  });

  it('starts and stops softly for a move with an end', () => {
    expect(Math.abs(tempo([0, 10, 20, 0], 0.0002))).toBeLessThan(1);
    expect(Math.abs(tempo([0, 10, 20, 0], 0.9998))).toBeLessThan(1);
  });

  it('runs on through the seam of a loop', () => {
    const loop: Partial<Animation> = { wiederholen: 'immer' };
    const w = [0, 6, 0, -6, 0];
    expect(wert(w, 0.0001, loop)).toBeCloseTo(wert(w, 0.9999, loop), 2);
    expect(tempo(w, 0.001, loop)).toBeCloseTo(tempo(w, 0.999, loop), 0);
    expect(Math.abs(tempo(w, 0.001, loop))).toBeGreaterThan(5);
  });
});

describe('curve per segment (kurven)', () => {
  it('speeds up into the landing with rein', () => {
    const a: Partial<Animation> = { ...ende, zeiten: [0, 0.5, 1], kurven: [null, 'rein'] };
    // second half 10 → 0: after a quarter of it the value has hardly fallen, at the end it moves fast
    expect(wert([0, 10, 0], 0.625, a)).toBeGreaterThan(9.5);
    expect(Math.abs(tempo([0, 10, 0], 0.99, a))).toBeGreaterThan(50);
  });
});

describe('lagging tracks (versatz)', () => {
  const a: Animation = { id: 't', name: 'T', dauer: 1, wiederholen: 1, spuren: { kopf: { drehen: [0, 10, 0] }, 'arm-r': { drehen: [0, 10, 0], versatz: 0.2 } } };
  const pose = { name: 'P', gesicht: 'froh' };

  it('starts later than the rest', () => {
    const st = stellung(pose, { animation: a, zeit: 0.15 });
    expect(st.teile['arm-r'].drehen).toBe(0);
    expect(st.teile.kopf.drehen).toBeGreaterThan(0);
  });

  it('still ends at rest with the move', () => {
    expect(spurPhase(a, 1, 0.2)).toBe(1);
    expect(stellung(pose, { animation: a, zeit: 0.999 }).teile['arm-r'].drehen).toBeCloseTo(0, 1);
  });

  it('shifts a loop and keeps it seamless', () => {
    const loop = { ...a, wiederholen: 'immer' as const };
    expect(spurPhase(loop, 0, 0.25)).toBeCloseTo(0.75);
    expect(spurPhase(loop, 0.25, 0.25)).toBeCloseTo(0);
  });
});

describe('blending into a new pose or move', () => {
  const pose = { name: 'P', gesicht: 'froh' };
  const von = stellung({ ...pose, winkel: { 'arm-r': 90 } });
  const nach = stellung({ ...pose, gesicht: 'au', winkel: { 'arm-l': 40 } });

  it('starts where the figure was and arrives at the new frame', () => {
    expect(mischeStellungen(von, nach, 0).teile['arm-r'].drehen).toBe(90);
    expect(mischeStellungen(von, nach, 1)).toBe(nach);
    const halb = mischeStellungen(von, nach, 0.5);
    expect(halb.teile['arm-r'].drehen).toBeGreaterThan(0);
    expect(halb.teile['arm-r'].drehen).toBeLessThan(45); // fast start, soft arrival
    expect(halb.teile['arm-l'].drehen).toBeGreaterThan(20);
  });

  it('shows the new face at once', () => {
    expect(mischeStellungen(von, nach, 0.1).gesicht).toBe('au');
  });
});

describe('parts in front during a move (vorne)', () => {
  const pose = { name: 'P', gesicht: 'froh', vorne: ['arm-l'] };
  const a: Animation = { id: 't', name: 'T', dauer: 1, wiederholen: 1, vorne: ['arm-r'], spuren: { 'arm-r': { drehen: [0, -120, 0] } } };

  it('draws the part in front while the move runs, and as the pose says after it', () => {
    expect(stellung(pose, { animation: a, zeit: 0.5 }).vorne).toEqual(['arm-l', 'arm-r']);
    expect(stellung(pose, { animation: a, zeit: 2 }).vorne).toEqual(['arm-l']);
  });

  it('only names top-level parts of the figures that use the move', async () => {
    const { FIGUREN } = await import('.');
    for (const f of FIGUREN)
      for (const id of f.animationen) for (const v of ANIMATIONEN[id].vorne ?? []) expect(f.teile.map((t) => t.id), `${f.id}/${id}`).toContain(v);
  });

  it('raises the hero\'s arm for hallo, in front of the head', () => {
    const st = stellung({ name: 'stehen', gesicht: 'froh' }, { animation: ANIMATIONEN.hallo, zeit: 0.6 });
    expect(st.teile['arm-r'].drehen).toBeLessThan(-100);
    expect(st.vorne).toContain('arm-r');
    expect(st.gesicht).toBe('lachen');
  });
});

describe('every move at 60 frames a second', () => {
  // No part jumps from one frame to the next: the largest step per frame stays small. "Treffer" is a deliberate shake.
  it('moves in small steps', () => {
    const pose = { name: 'P', gesicht: 'froh' };
    for (const a of Object.values(ANIMATIONEN)) {
      const n = Math.round(a.dauer * (a.wiederholen === 'immer' ? 1 : a.wiederholen) * 60);
      let vorher = stellung(pose, { animation: a, zeit: 0 });
      for (let i = 1; i <= n; i++) {
        const st = stellung(pose, { animation: a, zeit: i / 60 });
        expect(Math.abs(st.ganz.schieben[1] - vorher.ganz.schieben[1]), `${a.id} Bild ${i}`).toBeLessThan(4);
        expect(Math.abs(st.ganz.strecken[1] - vorher.ganz.strecken[1]), `${a.id} Bild ${i}`).toBeLessThan(0.06); // take-off and landing squash are quick on purpose (impact)
        for (const [id, l] of Object.entries(st.teile)) expect(Math.abs(l.drehen - (vorher.teile[id]?.drehen ?? 0)), `${a.id}/${id} Bild ${i}`).toBeLessThan(16);
        vorher = st;
      }
    }
  });
});
