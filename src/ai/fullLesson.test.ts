import { describe, expect, it } from 'vitest';
import { newLesson, seedLibrary } from '../library/model';
import { createSlide } from '../model/slides';
import type { AiRequest } from './client';
import { firstMode, runFullLesson, type StepKey, type StepState } from './fullLesson';

const lib = seedLibrary();
const m = lib.modules[0];
const planned = { ...newLesson(lib, m), number: 3, title: 'Folgen' };
const pkg = (text: string) => ({
  format: 'arbeitsblatt-baukasten-paket',
  version: 2,
  modules: [{ subject: m.subject, grade: m.grade, number: m.number, title: m.title, lessons: [{ number: 3, title: 'Folgen', pages: [{ title: 'Blatt', type: 'uebung', blocks: [{ type: 'text', props: { text } }, { type: 'open', props: { prompt: 'Erkläre.' } }] }] }] }],
});
const json = (x: unknown) => '```json\n' + JSON.stringify(x) + '\n```';

function fake(answers: Record<string, unknown>) {
  const asked: string[] = [];
  const steps: [StepKey, StepState][] = [];
  return {
    asked,
    steps,
    deps: {
      module: m,
      lesson: planned,
      doc: planned.doc,
      context: (w: string) => `Kontext ${w}`,
      notes: '',
      suggest: () => [createSlide('title'), createSlide('exit')],
      ask: async (r: Omit<AiRequest, 'signal' | 'onText'>) => {
        asked.push(r.what);
        if (r.what.endsWith('beheben')) expect(r.user).toContain('S1.2: Kein Material.');
        return { text: json(answers[r.what]), model: 'x', usd: 0.5, usage: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 } };
      },
      step: (k: StepKey, s: StepState) => steps.push([k, s]),
    },
  };
}

describe('Stunde komplett', () => {
  it('works out, checks, fixes and makes slides', async () => {
    const f = fake({
      'Stunde komplett: ausarbeiten': pkg('Erst'),
      'Stunde komplett: prüfen': { findings: [{ ref: 'S1.2', kind: 'loesbar', problem: 'Kein Material.', fix: 'Infotext ergänzen.' }] },
      'Stunde komplett: beheben': pkg('Behoben'),
      'Stunde komplett: Folien': { slides: [{ layout: 'big', title: '2 °C' }] },
    });
    const r = (await runFullLesson(f.deps, ''))!;
    expect(f.asked).toHaveLength(4);
    expect(r.doc.pages[0].blocks[0].props.text).toBe('Behoben');
    expect(r.findings).toHaveLength(1);
    expect(r.slides.map((s) => s.layout)).toEqual(['big']);
    expect(r.usd).toBe(2);
  });

  it('skips the fix when the check finds nothing, and keeps a worked-out lesson', async () => {
    expect(firstMode(lib.lessons[0].doc)).toBeNull();
    const f = fake({ 'Stunde komplett: prüfen': { findings: [] }, 'Stunde komplett: Folien': { slides: [{ layout: 'title', title: 'X' }] } });
    const r = (await runFullLesson({ ...f.deps, lesson: lib.lessons[0], doc: lib.lessons[0].doc }, ''))!;
    expect(f.asked).toEqual(['Stunde komplett: prüfen', 'Stunde komplett: Folien']);
    expect(r.doc).toBe(lib.lessons[0].doc);
    expect(f.steps.find(([k]) => k === 'fix')![1].state).toBe('skip');
  });

  it('keeps the suggested slides when Claude fails on them', async () => {
    const f = fake({ 'Stunde komplett: ausarbeiten': pkg('A'), 'Stunde komplett: prüfen': { findings: [] }, 'Stunde komplett: Folien': { nix: 1 } });
    const r = (await runFullLesson(f.deps, ''))!;
    expect(r.slides.map((s) => s.layout)).toEqual(['title', 'exit']);
    expect(f.steps.at(-1)![1].state).toBe('fail');
  });
});
