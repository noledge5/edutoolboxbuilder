/* Renders worksheet pages, bands and slides with the real classes of sheet.css / slides.css. */
(function () {
  const I = {
    compass: '<circle cx="12" cy="12" r="10"/><path d="m16.24 7.76-1.804 5.411a2 2 0 0 1-1.265 1.265L7.76 16.24l1.804-5.411a2 2 0 0 1 1.265-1.265z"/>',
    thermo: '<path d="M12 9a4 4 0 0 0-2 7.5"/><path d="M12 3v2"/><path d="m6.6 18.4-1.4 1.4"/><path d="M20 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z"/><path d="M4 13H2"/><path d="M6.34 7.34 4.93 5.93"/>',
    house: '<path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/><path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
    building: '<path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/>',
    lock: '<rect width="18" height="11" x="3" y="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
    repeat: '<path d="m17 2 4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="m7 22-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/>',
    info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>',
    bulb: '<path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/>',
    user: '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
    users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  };
  const icon = (n, s) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.75" stroke-linecap="round" stroke-linejoin="round">${I[n]}</svg>`;

  const L = {
    de: { name: 'Name:', klasse: null, date: 'Datum:', page: 'Seite', merk: 'Merksatz', bank: 'Wortspeicher', true: 'richtig', false: 'falsch',
      types: { uebung: 'Übung', versuch: 'Versuch', sicherung: 'Sicherung', lehrkraft: 'Für die Lehrkraft', wortschatz: 'Wortschatz', grammatik: 'Grammatik', hoeren: 'Hören', sprechen: 'Sprechen', test: 'Test' },
      forms: { allein: 'allein', zweit: 'zu zweit', gruppe: 'Gruppe', plenum: 'Plenum' }, min: 'Minuten', task: 'Aufgabe', work: 'Arbeitsauftrag', who: ['Ich', 'Du', 'Wir'] },
    en: { name: 'Name:', klasse: 'Class:', date: 'Date:', page: 'Page', merk: 'Remember', bank: 'Word bank', true: 'true', false: 'false',
      types: { uebung: 'Practice', versuch: 'Experiment', sicherung: 'Summary', lehrkraft: 'For the teacher', wortschatz: 'Vocabulary', grammatik: 'Grammar', hoeren: 'Listening', sprechen: 'Speaking', test: 'Test' },
      forms: { allein: 'alone', zweit: 'with a partner', gruppe: 'in groups', plenum: 'whole class' }, min: 'minutes', task: 'Task', work: 'Your task', who: ['Me', 'You', 'Us'] },
  };
  const TYPES = ['uebung', 'versuch', 'test', 'sicherung', 'hoeren', 'wortschatz', 'grammatik', 'sprechen', 'lehrkraft'];
  const formIcon = f => icon(f === 'allein' ? 'user' : 'users', 14);
  const blanks = (s, cls) => s.replace(/___/g, `<span class="${cls}"></span>`);

  function band(d, type, p) {
    const l = L[d.lang];
    return `<div class="ws-band"><div class="ws-band-icon">${icon(d.icon, 26)}</div><div class="ws-band-text"><div class="ws-kicker">${p.kicker}</div><h1 class="ws-title">${p.title}</h1></div><div class="ws-band-side"><span class="ws-type-pill">${l.types[type]}</span><span class="ws-form-pill">${formIcon(p.form)}${l.forms[p.form]}</span></div></div>`;
  }
  function names(d) {
    const l = L[d.lang];
    return `<div class="ws-names"><b>${l.name}</b><span class="ws-line"></span>${l.klasse ? `<b>${l.klasse}</b><span class="ws-line is-short"></span>` : ''}<b>${l.date}</b><span class="ws-line is-date"></span></div>`;
  }
  function foot(d, n) {
    return `<div class="ws-foot"><span class="ws-foot-text">${d.footer}</span><span class="ws-foot-code">${d.code}</span><span class="ws-foot-page">${L[d.lang].page} ${n}</span></div>`;
  }
  function inner(b, d) {
    const l = L[d.lang];
    switch (b.k) {
      case 'mc': return `<div class="ws-options">${b.options.map(o => `<div class="ws-option"><span class="ws-check"></span>${o}</div>`).join('')}</div>`;
      case 'gap': return `<div class="ws-gap">${blanks(b.text, 'ws-blank')}</div>`;
      case 'open': return `<div class="ws-lines">${'<div></div>'.repeat(b.lines || 3)}</div>`;
      case 'table': {
        const gc = `grid-template-columns:1.2fr repeat(${b.cols.length},1fr)`;
        return `<div class="ws-table"><div class="ws-table-head" style="${gc}"><div>${b.first || ''}</div>${b.cols.map(c => `<div>${c}</div>`).join('')}</div>${b.rows.map(r => `<div class="ws-table-row" style="${gc}"><div class="ws-table-label">${r}</div>${'<div class="ws-table-cell"></div>'.repeat(b.cols.length)}</div>`).join('')}</div>`;
      }
      case 'match': return `<div class="ws-match">${b.left.map((x, i) => `<div class="ws-match-row"><div class="ws-match-item">${x}<span class="ws-dot"></span></div><div></div><div class="ws-match-item is-right"><span class="ws-dot"></span>${b.right[i]}</div></div>`).join('')}</div>`;
      case 'tf': {
        const gc = 'grid-template-columns:minmax(0,1fr) 64px 64px';
        return `<div class="ws-tf"><div class="ws-tf-row is-head" style="${gc}"><div></div><div>${l.true}</div><div>${l.false}</div></div>${b.rows.map(r => `<div class="ws-tf-row" style="${gc}"><div>${r}</div><div><span class="ws-check"></span></div><div><span class="ws-check"></span></div></div>`).join('')}</div>`;
      }
      case 'image': return `<div class="ws-image" style="height:${b.height}px"><div class="ws-image-empty">${b.placeholder}</div></div>`;
      case 'flow': return flow(b);
      case 'wordbank': return wordbank(b, d);
      default: return '';
    }
  }
  const flow = b => `<div class="ws-flow">${b.steps.map((s, i) => `<div class="ws-flow-step is-c${i % 4 + 1}"><div class="ws-flow-title">${s[0]}</div>${s[1] ? `<div class="ws-flow-sub">${blanks(s[1], 'ws-blank')}</div>` : ''}</div>`).join('<div class="ws-flow-arrow">→</div>')}</div>`;
  const wordbank = (b, d) => `<div class="ws-wordbank"><span class="ws-label">${L[d.lang].bank}</span>${b.words.map(w => `<span class="ws-word">${w}</span>`).join('')}</div>`;

  function block(b, d, num) {
    const span = `grid-column:span ${b.span || 12}`;
    if (b.task) {
      const extra = (b.more || []).map(m => inner(m, d)).join('');
      return `<div class="ws-task" style="${span}"><div class="ws-num">${num}</div><div class="ws-task-main"><div class="ws-prompt">${b.prompt}</div>${inner(b, d)}${extra}</div></div>`;
    }
    const l = L[d.lang];
    switch (b.k) {
      case 'heading': return `<h3 class="ws-h3" style="${span}">${b.text}</h3>`;
      case 'text': return `<p class="ws-text" style="${span}">${b.text}</p>`;
      case 'hint': return `<div class="ws-hint is-v-${b.v || 's'}" style="${span}"><div class="ws-hint-icon">${icon('info', 16)}</div><div class="ws-hint-body"><div class="ws-hint-title">${b.title}</div>${b.text}</div></div>`;
      case 'merksatz': return `<div class="ws-merksatz is-v-${b.v || 'p'}" style="${span}"><div class="ws-merksatz-icon">${icon('bulb', 20)}</div><div><div class="ws-label">${l.merk}</div><div class="ws-merksatz-text">${blanks(b.text, 'ws-blank-lg')}</div></div></div>`;
      case 'wordbank': return `<div style="${span}">${wordbank(b, d)}</div>`;
      case 'flow': return `<div style="${span}">${flow(b)}</div>`;
      case 'figure': return `<div class="ws-figure" style="${span}"><div class="ws-image" style="height:${b.height}px"><div class="ws-image-empty">${b.placeholder}</div></div><div class="ws-caption">${b.caption}</div></div>`;
      case 'code': return `<pre class="ws-code" style="${span}">${b.lines.map(x => `<span>${x}</span>`).join('')}</pre>`;
      case 'reading': {
        const nums = [5, 10, 15, 20, 25].map(n => `<span style="top:${(n - 1) * 22}px">${n}</span>`).join('');
        return `<div class="ws-reading" style="${span}"><div class="ws-label" style="color:var(--t-kicker)">${b.title}</div><div class="ws-reading-body"><div class="ws-reading-numbers">${nums}</div><div class="ws-reading-text">${b.text}</div></div><div class="ws-reading-gloss">${b.gloss.map(g => `<span><b>${g[0]}</b> – ${g[1]}</span>`).join('')}</div></div>`;
      }
    }
    return '';
  }
  function cls(d, extra) { return `is-fd is-f-${d.fach} is-age-${d.age}${d.variants ? ' is-x-' + variant(d) : ''}${extra ? ' ' + extra : ''}`; }
  function variant(d) { const v = localStorage.getItem('fd-x-' + d.key); return d.variants && d.variants[v] ? v : Object.keys(d.variants)[0]; }
  function view(d) { return d.variants ? Object.assign({}, d, d.variants[variant(d)]) : d; }

  function page(d, o = {}) {
    let n = 0;
    const body = d.page.blocks.map(b => block(b, d, b.task ? ++n : 0)).join('');
    return `<div class="ws-page ${cls(d, 'is-t-uebung' + (o.bw ? ' is-bw' : ''))}" lang="${d.lang}">${band(d, 'uebung', d.page)}${names(d)}<div class="ws-body">${body}</div>${foot(d, 1)}</div>`;
  }
  function bands(d) {
    return `<div class="ws-page fd-strip ${cls(d)}" lang="${d.lang}">${TYPES.map(t => `<div class="is-t-${t}">${band(d, t, d.page)}</div>`).join('')}</div>`;
  }

  /* — slides — */
  function bar(d, s) {
    const l = L[d.lang];
    return `<div class="sl-bar"><div class="sl-bar-icon">${icon(d.icon, 36)}</div><div class="sl-bar-kicker">${d.slides.bar}</div><div class="sl-phase">${s.phase}</div><div class="sl-form">${icon(s.form === 'allein' ? 'user' : 'users', 28)}${l.forms[s.form]} · ${s.min} min</div></div>`;
  }
  const sfoot = (d, n) => `<div class="sl-foot"><span>${d.footer}</span><strong>${n}</strong></div>`;
  function slideTitle(d) {
    const t = d.slides.title;
    return `<div class="sl-slide is-title ${cls(d, 'is-t-uebung')}" lang="${d.lang}"><div class="sl-deco is-one"></div><div class="sl-deco is-two"></div><div class="sl-title-icon">${icon(d.icon, 60)}</div><div class="sl-title-kicker">${t.kicker}</div><h1 class="sl-title-h1">${t.h1}</h1><div class="sl-title-sub">${t.sub}</div></div>`;
  }
  function slideTask(d, open) {
    const t = d.slides.task, l = L[d.lang];
    const items = t.items.map((it, i) => {
      const letter = String.fromCharCode(97 + i);
      let text = it.text, ans = '';
      if (/\{.+?\}/.test(text)) {
        text = text.replace(/\{(.+?)\}/, (_, w) => open ? `<span class="sl-gap"><span class="sl-gap-word sl-anim-flip">${w}</span></span>` : `<span class="sl-gap is-covered"><span class="sl-gap-word">${w}</span><span class="sl-card">${i + 1}</span></span>`);
      } else {
        ans = open ? `<div class="sl-answer">${it.answer}</div>` : `<div class="sl-answer is-covered">${it.answer}<span class="sl-card">${i + 1}</span></div>`;
      }
      return `<div class="sl-task-item"><div class="sl-task-letter">${letter}</div><div class="sl-item-text">${text}</div>${ans}</div>`;
    }).join('');
    return `<div class="sl-slide is-task ${cls(d, 'is-t-uebung')}" lang="${d.lang}">${bar(d, t)}<div class="sl-task-head"><div class="sl-num is-task">${t.num}</div><div class="sl-task-lead"><div class="sl-label">${l.task} ${t.num}</div><h1 class="sl-task-h1">${t.h1}</h1>${t.help ? `<div class="sl-task-help">${t.help}</div>` : ''}</div></div><div class="sl-task-body"><div class="sl-task-main"><div class="sl-task-items">${items}</div></div></div>${sfoot(d, t.no)}</div>`;
  }
  function slideWork(d) {
    const w = d.slides.work, l = L[d.lang];
    const steps = w.steps.map((s, i) => `<li class="sl-wp-step ${i === 0 ? 'is-done' : i === 1 ? 'is-current' : 'is-coming'}"><span class="sl-wp-who">${icon(i === 0 ? 'user' : 'users', 32)}<b>${l.who[i]}</b></span><span class="sl-wp-text">${s[0]}</span><span class="sl-wp-min">${s[1]} min</span></li>`).join('');
    return `<div class="sl-slide is-work ${cls(d, 'is-t-uebung')}" lang="${d.lang}">${bar(d, w)}<div class="sl-wp has-steps"><div class="sl-wp-main"><div class="sl-lead"><div class="sl-label">${l.work}</div><h1 class="sl-h1 sl-wp-h1">${w.h1}</h1></div><ol class="sl-wp-steps">${steps}</ol></div><div class="sl-wp-side"><div class="sl-wp-clock"><b>${w.min}</b><span>${l.min}</span></div><div class="sl-wp-form">${icon(w.form === 'allein' ? 'user' : 'users', 34)}${l.forms[w.form]}</div></div></div>${sfoot(d, w.no)}</div>`;
  }
  window.FD = { cls, variant, view, page, bands, slideTitle, slideTask, slideWork, TYPES, L, icon };
})();
