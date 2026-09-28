import { describe, expect, it } from 'vitest';
import { addTiming, cssColor, timingXml } from './pptx';

describe('PowerPoint export', () => {
  it('reads CSS colours as hex and opacity', () => {
    expect(cssColor('rgb(198, 113, 57)')).toEqual({ hex: 'C67139', alpha: 1 });
    expect(cssColor('rgba(0, 0, 0, 0.5)')).toEqual({ hex: '000000', alpha: 0.5 });
    expect(cssColor('rgba(0, 0, 0, 0)')).toBeNull();
    expect(cssColor('transparent')).toBeNull();
  });

  it('turns clicks into entrance animations, one click per step', () => {
    const xml = timingXml([
      { id: 4, step: 1, anim: 'fade', picture: false },
      { id: 5, step: 1, anim: 'rise', picture: true },
      { id: 6, step: 2, anim: 'none', picture: false },
      { id: 7, step: 0, anim: 'fade', picture: false },
    ]);
    expect(xml.match(/delay="indefinite"/g)).toHaveLength(2);
    expect(xml.match(/nodeType="clickEffect"/g)).toHaveLength(2);
    expect(xml.match(/nodeType="withEffect"/g)).toHaveLength(1);
    expect(xml).toContain('<p:spTgt spid="5"/>');
    expect(xml).not.toContain('<p:spTgt spid="7"/>');
    // Pictures are animated without a build entry; shapes and text boxes have one.
    expect(xml).toContain('<p:bldP spid="4" grpId="0" animBg="1"/>');
    expect(xml).not.toContain('<p:bldP spid="5"');
    // The ids of the time nodes are unique.
    const ids = [...xml.matchAll(/<p:cTn id="(\d+)"/g)].map((m) => m[1]);
    expect(new Set(ids).size).toBe(ids.length);
    expect(timingXml([{ id: 4, step: 0, anim: 'fade', picture: false }])).toBe('');
  });

  it('adds transition and timing after the colour mapping of a slide', () => {
    const slide = '<p:sld><p:cSld><p:spTree><p:sp><p:nvSpPr><p:cNvPr id="3" name="Text 1"/></p:nvSpPr></p:sp></p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sld>';
    const out = addTiming(slide, [{ name: 'Text 1', step: 1, anim: 'fade', picture: false }], 'fade');
    expect(out).toMatch(/<\/p:clrMapOvr><p:transition spd="med"><p:fade\/><\/p:transition><p:timing>.*<p:spTgt spid="3"\/>.*<\/p:timing><\/p:sld>$/);
    expect(addTiming(slide, [], 'none')).toBe(slide);
  });
});
