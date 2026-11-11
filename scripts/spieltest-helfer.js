// Helpers to play Lernquest from the browser console during `npm run spieltest` (after scripts/spieltest-daten.js):
// `T.solve(true)` answers the exercise on screen right, `T.solve(false)` wrong, for every format; `T.fb()` is the
// feedback shown, `T.txt()` the page as text. Not part of the app.
window.T = {
  sleep: (ms) => new Promise((r) => setTimeout(r, ms)),
  q: (s) => [...document.querySelectorAll(s)],
  b: (t) => T.q('button').find((b) => b.textContent.trim() === t || b.getAttribute('aria-label') === t),
  async c(t) {
    const b = T.b(t);
    if (!b) throw new Error(`no button ${t}`);
    if (b.disabled) throw new Error(`disabled ${t}`);
    b.click();
    await T.sleep(250);
  },
  async tab(t) {
    T.q('.lq-leiste button').find((b) => b.innerText.trim().startsWith(t)).click();
    await T.sleep(300);
  },
  txt: () => document.querySelector('main').innerText.replace(/\n+/g, ' | '),
  fb: () => document.querySelector('.lq-rueckmeldung')?.innerText.replace(/\n+/g, ' | '),
  bar: () => document.querySelector('.lq-fortschritt .lq-balken > span')?.style.width,
  hearts: () => document.querySelector('.lq-fortschritt [aria-label*="Herz"]')?.getAttribute('aria-label'),
  all: () => Object.values(JSON.parse(localStorage.getItem('lernquest:daten')).pakete).flatMap((p) => p.uebungen),
  /** The exercise on screen, found in the stored packages by its question and content. */
  cur() {
    const clean = (s) => s.replace(/\*\*|\{\{|\}\}/g, '');
    const f = document.querySelector('.lq-frage').innerText.trim();
    const body = document.querySelector('.lq-uebung').innerText;
    return T.all()
      .filter((u) => clean(u.frage) === f)
      .find((u) =>
        u.art === 'waehlen' ? (u.hoeren ? true : u.optionen.every((o) => body.includes(o)))
        : u.art === 'richtigfalsch' ? body.includes(clean(u.aussage))
        : u.art === 'paare' ? u.paare.every((p) => body.includes(p[1]))
        : u.art === 'luecke' ? body.includes(u.teile[0].trim())
        : u.art === 'reihenfolge' ? u.kacheln.every((k) => body.includes(k))
        : u.art === 'gruppen' ? u.gruppen.every((g) => body.includes(g))
        : u.art === 'bild' ? body.includes(u.wort)
        : true,
      );
  },
  async solve(right = true) {
    const u = T.cur();
    if (!u) throw new Error(`unknown exercise: ${T.txt()}`);
    const tile = (w) => T.q('.lq-kacheln .lq-kachel').find((b) => b.innerText === w && !b.disabled);
    if (u.art === 'waehlen') {
      const want = right ? u.richtig : [u.optionen.findIndex((_, i) => !u.richtig.includes(i))];
      for (const i of want) {
        T.q('.lq-uebung .lq-option').find((b) => b.innerText.trim() === u.optionen[i]).click();
        await T.sleep(60);
      }
    } else if (u.art === 'richtigfalsch') {
      T.q('.lq-rf button')[u.richtig === right ? 0 : 1].click();
    } else if (u.art === 'paare') {
      const cols = T.q('.lq-paare > div');
      const L = [...cols[0].children];
      const R = [...cols[1].children];
      const m = Object.fromEntries(u.paare);
      if (!right)
        for (let k = 0; k < 2; k++) {
          L[0].click();
          await T.sleep(60);
          R.find((b) => b.innerText.trim() !== m[L[0].innerText.trim()]).click();
          await T.sleep(750);
        }
      for (const l of L) {
        l.click();
        await T.sleep(60);
        R.find((b) => b.innerText.trim() === m[l.innerText.trim()]).click();
        await T.sleep(120);
      }
      await T.sleep(200);
      return u;
    } else if (u.art === 'luecke') {
      const want = u.teile.filter((_, i) => i % 2);
      if (!right) want[0] = u.kacheln.find((k) => !want.includes(k));
      for (const w of want) {
        tile(w).click();
        await T.sleep(60);
      }
    } else if (u.art === 'reihenfolge') {
      let words = u.loesung.replace(/([.?!])$/, ' $1').split(' ');
      if (!right) words = [...words].reverse();
      for (const w of words) {
        tile(w).click();
        await T.sleep(60);
      }
    } else if (u.art === 'gruppen') {
      for (let n = 0; n < u.karten.length; n++) {
        const t = document.querySelector('.lq-sortkarte').innerText.trim();
        const g = u.karten.find((k) => k[0] === t)[1];
        const heads = T.q('.lq-gruppe-kopf');
        heads[right ? g : (g + 1) % heads.length].click();
        await T.sleep(80);
      }
    } else if (u.art === 'bild') {
      const bs = T.q('.lq-bild');
      const want = u.bilder[u.richtig];
      const hit = bs.find((b) => b.querySelector('.lq-emoji')?.innerText === want || (want.startsWith('img:') && b.querySelector('img')));
      (right ? hit : bs.find((b) => b !== hit)).click();
    } else if (u.art === 'punkt') {
      const fl = document.querySelector('.lq-karte-flaeche');
      for (let n = 0; n < u.punkte.length; n++) {
        const name = document.querySelector('.lq-wort b').innerText;
        const p = u.punkte.find((x) => x[2] === name);
        const r = fl.getBoundingClientRect();
        fl.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: r.left + (r.width * (right ? p[0] : 5)) / 100, clientY: r.top + (r.height * (right ? p[1] : 5)) / 100 }));
        await T.sleep(120);
      }
      await T.sleep(200);
      return u;
    }
    await T.sleep(100);
    await T.c('Prüfen');
    return u;
  },
};
