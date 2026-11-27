// Walkthrough of the Lernquest kid app with Playwright: plays it like a child (map, class with village, hero, shop,
// tasks, review, a chest, a round with a wrong and a right answer, result) on four screens and checks every screen for
// sideways scrolling, cut text, buttons under 40 px, answers hidden under the check bar and console errors.
// The boss fight goes through waiting, a question, the answer, the reveal and the win with faked server answers.
// Run `npm run spieltest` first, then `npm run rundgang [ordner]` (screenshots go there; default: the system's temp
// folder). LQ_URL points elsewhere (e.g. http://localhost:5181/lernquest/ for `npm run demo`). Exit code 1 on findings.
// Uses the made-up child of scripts/spieltest-daten.js; the dead server's answers for the chest and the class are faked.
import { createRequire } from "node:module";
import { mkdirSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const HIER = dirname(fileURLToPath(import.meta.url));
const URL = process.env.LQ_URL || "http://localhost:4174/lernquest/";
const ORDNER = process.argv[2] || join(tmpdir(), "lernquest-rundgang");
const DATEN = readFileSync(join(HIER, "spieltest-daten.js"), "utf8");
const HELFER = readFileSync(join(HIER, "spieltest-helfer.js"), "utf8");
const GERAETE = [
  ["handy", 390, 844],
  ["klein", 375, 667],
  ["ipad", 820, 1180],
  ["quer", 1180, 820],
];
/** What the dead server (127.0.0.1:9) answers in this walkthrough. */
const KLASSE = {
  lq_klasse_ansicht: {
    klasse: "5b",
    tage: 9,
    kinder: [
      { name: "Mia K.", avatar: {}, ich: true },
      {
        name: "Ali",
        avatar: {
          frisur: "locken",
          haut: 3,
          kleidung: "kapuzenpulli",
          kopf: "kappe",
        },
        ich: false,
      },
      {
        name: "Bea",
        avatar: { frisur: "zoepfe", haut: 0, kleidung: "latzhose" },
        ich: false,
      },
      {
        name: "Can",
        avatar: {
          frisur: "kurz",
          haut: 4,
          kleidung: "trikot",
          kopf: "wollmuetze",
        },
        ich: false,
      },
      {
        name: "Dana",
        avatar: { frisur: "bob", haut: 1, kleidung: "regenjacke" },
        ich: false,
      },
    ],
  },
  lq_dorf: {
    an: true,
    projekt: {
      id: "p1",
      gebaeude: "baeckerei",
      ziel: 1000,
      stand: 420,
      belohnung: null,
      helfer: 5,
    },
    fertig: [
      {
        gebaeude: "brunnen",
        belohnung: null,
        fertig: "2026-11-20",
        stifter: [],
      },
      {
        gebaeude: "bruecke",
        belohnung: null,
        fertig: "2026-11-24",
        stifter: [],
      },
    ],
    woche: 30,
    haeuser: {
      an: true,
      ich: 2,
      plaetze: [
        { stufe: 1 },
        { stufe: 2 },
        { stufe: 3 },
        { stufe: null },
        { stufe: 0 },
        { stufe: 2 },
      ],
    },
  },
};

/** What a child's phone gets from `lq_boss_stand` in each phase (Welcome to school, question 3 of 6, 24 children). */
function bossStand(boss) {
  if (!boss) return undefined;
  const { phase, wahl } = boss;
  const offen = phase === "aufloesung" || phase === "ende";
  return {
    id: "b1",
    titel: "Welcome to school",
    boss: 0,
    phase,
    modus: "geraete",
    frage: phase === "warten" ? -1 : 2,
    fragen: 6,
    lp: phase === "ende" ? 0 : phase === "aufloesung" ? 58 : 70,
    lpMax: 120,
    herzen: 3,
    sieg: phase === "ende" ? true : null,
    rest: 14000,
    kinder: 24,
    antworten: 17,
    optionen: [
      "There is a book on the table.",
      "There are a book on the table.",
      "There am a book on the table.",
      "There be a book.",
    ],
    richtig: offen ? 0 : null,
    dabei: true,
    serie: 3,
    truhe: phase === "ende",
    wahl,
    schaden: phase === "aufloesung" && wahl === 0 ? 12 : null,
  };
}

/** Checks of one screen, run in the page. */
function pruefen() {
  const vw = innerWidth;
  const sichtbar = (el) => {
    const s = getComputedStyle(el);
    return (
      s.display !== "none" && s.visibility !== "hidden" && +s.opacity > 0.05
    );
  };
  const scrollt = (el) => {
    for (let a = el.parentElement; a; a = a.parentElement)
      if (/auto|scroll/.test(getComputedStyle(a).overflowX)) return true;
    return false;
  };
  const name = (el) =>
    (typeof el.className === "string" && el.className
      ? "." + el.className.split(" ")[0]
      : el.tagName.toLowerCase()) +
    " „" +
    (el.innerText || el.getAttribute("aria-label") || "").trim().slice(0, 30) +
    "“";
  const out = [];
  // the widest the page got since the last screen (animations can push it out for a moment only)
  if (
    Math.max(window.__breiteste || 0, document.documentElement.scrollWidth) >
    vw + 1
  )
    out.push("Seite scrollt seitwärts");
  window.__breiteste = 0;
  for (const el of document.querySelectorAll("body *")) {
    if (el.closest("svg") || !sichtbar(el)) continue;
    const r = el.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) continue;
    const text = (el.innerText || "").trim();
    // empty decoration (sparkles, confetti) may fly out
    if ((r.right > vw + 2 || r.left < -2) && text && !scrollt(el))
      out.push("ragt raus: " + name(el));
    const s = getComputedStyle(el);
    if (
      !el.children.length &&
      text &&
      !el.matches(".lq-unsichtbar") &&
      el.scrollWidth > el.clientWidth + 2 &&
      (s.overflowX === "hidden" || s.textOverflow === "ellipsis")
    )
      out.push("abgeschnitten: " + name(el));
    if (
      el.matches("button, a[href], [role=button], input, select") &&
      !el.disabled &&
      (r.width < 40 || r.height < 40)
    )
      out.push(
        "klein: " +
          name(el) +
          " " +
          Math.round(r.width) +
          "×" +
          Math.round(r.height),
      );
  }
  const fuss = document.querySelector(".lq-fuss");
  if (fuss) {
    const oben = fuss.getBoundingClientRect().top;
    for (const el of document.querySelectorAll(
      ".lq-uebung button, .lq-bild, .lq-option, .lq-kachel",
    )) {
      const r = el.getBoundingClientRect();
      if (r.height && r.bottom > oben + 2)
        out.push(
          "verdeckt: " + name(el) + " " + Math.round(r.bottom - oben) + " px",
        );
    }
  }
  return [...new Set(out)];
}

async function rundgang(browser, [geraet, w, h]) {
  const ctx = await browser.newContext({
    viewport: { width: w, height: h },
    deviceScaleFactor: 2,
    hasTouch: true,
    isMobile: w < 600,
  });
  const p = await ctx.newPage();
  const befunde = [];
  p.on("pageerror", (e) => befunde.push("Fehler: " + e));
  p.on(
    "console",
    (m) =>
      m.type() === "error" &&
      !/Failed to load resource|ERR_/.test(m.text()) &&
      befunde.push("Konsole: " + m.text()),
  );
  // watch the page's width all the time, not only when a screenshot is taken
  await p.addInitScript(() =>
    setInterval(
      () =>
        (window.__breiteste = Math.max(
          window.__breiteste || 0,
          document.documentElement.scrollWidth,
        )),
      50,
    ),
  );
  let stand = {};
  // the boss fight: null = none running; its phase is moved on by the walkthrough
  let boss = null;
  await p.route("http://127.0.0.1:9/**", (r) => {
    if (r.request().method() === "OPTIONS")
      return r.fulfill({
        status: 204,
        headers: {
          "access-control-allow-origin": "*",
          "access-control-allow-headers": "*",
          "access-control-allow-methods": "*",
        },
      });
    const fn = r.request().url().split("/rpc/")[1];
    if (fn === "lq_boss_antworten" && boss)
      boss.wahl = JSON.parse(r.request().postData() || "{}").p_wahl ?? 0;
    const body =
      fn === "lq_boss_offen"
        ? boss && { id: "b1", titel: "Welcome to school", boss: 0 }
        : fn === "lq_boss_stand"
          ? bossStand(boss)
          : fn === "lq_boss_antworten"
            ? { angenommen: true }
            : fn === "lq_truhe_oeffnen"
              ? {
                  teil: "zauberhut",
                  seltenheit: 2,
                  doppelt: false,
                  muenzen: 0,
                  stand: { ...stand, truhen: 0 },
                }
              : KLASSE[fn];
    return body === undefined
      ? r.abort()
      : r.fulfill({
          status: 200,
          contentType: "application/json",
          headers: { "access-control-allow-origin": "*" },
          body: JSON.stringify(body),
        });
  });
  let n = 0;
  const schritt = async (name, tun, { ganz = false, warte = 900 } = {}) => {
    try {
      if (tun) await tun();
      await p.waitForTimeout(warte);
      await p.screenshot({
        path: join(
          ORDNER,
          `${geraet}-${String(++n).padStart(2, "0")}-${name}.png`,
        ),
        fullPage: ganz,
      });
      for (const b of await p.evaluate(pruefen)) befunde.push(`${name}: ${b}`);
    } catch (e) {
      befunde.push(`${name}: ging nicht (${String(e).split("\n")[0]})`);
    }
  };
  const knopf = (t, exact = false) =>
    p.getByRole("button", { name: t, exact }).first();
  const tab = (t) => p.locator(".lq-leiste button", { hasText: t }).first();

  await p.goto(URL);
  await p.evaluate(DATEN);
  await p.reload();
  await p.waitForTimeout(1500);
  stand = await p.evaluate(
    () => JSON.parse(localStorage.getItem("lernquest:daten")).stand,
  );
  // Class, hero and chest first: after a round played offline the app waits to send it and asks the server nothing else.
  await schritt("karte", null, { ganz: true });
  await schritt("klasse", () => tab("Klasse").click(), {
    ganz: true,
    warte: 2500,
  });
  await schritt("held", () => tab("Held").click(), { ganz: true, warte: 1200 });
  await schritt("laden", () => knopf("Laden").click(), {
    ganz: true,
    warte: 1200,
  });
  await schritt("aufgaben", () => tab("Aufgaben").click(), { ganz: true });
  await schritt("wiederholen", () => tab("Wiederholen").click(), {
    ganz: true,
  });
  // A boss fight through all its phases (before the round: after a round played offline the app asks the server nothing).
  boss = { phase: "warten", wahl: null };
  await p.reload();
  await p.waitForTimeout(1500);
  await schritt("boss-karte", null, { ganz: true });
  await schritt(
    "boss-warten",
    () => p.locator(".lq-boss-band").first().click(),
    { warte: 1800 },
  );
  await schritt("boss-frage", () => (boss.phase = "frage"), { warte: 1600 });
  await schritt("boss-gewaehlt", () => p.locator(".lq-pad").first().click(), {
    warte: 1500,
  });
  await schritt("boss-aufloesung", () => (boss.phase = "aufloesung"), {
    warte: 1600,
  });
  await schritt("boss-ende", () => (boss.phase = "ende"), { warte: 2600 });
  await knopf("Zur Karte").click();
  boss = null;
  await p.reload();
  await p.waitForTimeout(1200);
  await tab("Karte").click();
  await p.waitForTimeout(800);
  await schritt("truhe", () => knopf("Öffnen").click(), { warte: 1200 });
  await schritt(
    "truhe-auf",
    () => p.getByRole("button", { name: "Öffnen", exact: true }).last().click(),
    { warte: 1300 },
  );
  await schritt("truhe-da", null, { warte: 2800 });
  await schritt("nach-truhe", () => knopf("Weiter", true).click(), {
    warte: 1200,
  });
  await schritt(
    "runde",
    () => p.locator(".lq-knoten.aktuell").first().click(),
    { warte: 1500 },
  );
  await p.evaluate(HELFER);
  await schritt("falsch", () => p.evaluate(() => T.solve(false)));
  await schritt("richtig", async () => {
    await knopf("Weiter", true).click();
    await p.waitForTimeout(600);
    await p.evaluate(() => T.solve(true));
  });
  await schritt(
    "ergebnis",
    async () => {
      for (
        let i = 0;
        i < 30 && !(await p.locator(".lq-ergebnis").count());
        i++
      ) {
        const weiter = p.getByRole("button", { name: "Weiter", exact: true });
        if (await weiter.count()) await weiter.first().click();
        else await p.evaluate(() => T.solve(true)).catch(() => {});
        await p.waitForTimeout(450);
      }
    },
    { warte: 3200 },
  );
  await schritt("karte-danach", () => knopf("Zur Karte").click(), {
    warte: 1800,
  });
  await ctx.close();
  return befunde;
}

mkdirSync(ORDNER, { recursive: true });
// Port 9 is blocked by Chrome; the walkthrough answers for it.
const browser = await chromium.launch({
  args: ["--explicitly-allowed-ports=9", "--disable-web-security"],
});
const alle = await Promise.all(GERAETE.map((g) => rundgang(browser, g)));
await browser.close();
let zahl = 0;
GERAETE.forEach(([geraet, w, h], i) => {
  console.log(`${geraet} (${w}×${h}): ${alle[i].length ? "" : "ok"}`);
  for (const b of alle[i]) console.log("  " + b);
  zahl += alle[i].length;
});
console.log(`Bilder: ${ORDNER}`);
process.exit(zahl ? 1 : 0);
