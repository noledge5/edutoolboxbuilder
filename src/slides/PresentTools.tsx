// The tools while presenting, used in the bar at the bottom and in the speaker view: timer, Ampel, black and
// white screen; and what the class sees of them: the timer bar, the traffic light, the blank screen.
import { useState } from 'react';
import { MonitorOff, Pause, Play, Square, Timer as TimerIcon, TimerOff, Volume2, VolumeX } from 'lucide-react';
import { Icon } from '../icons';
import { AMPEL_LEVELS, clockText, isOver, leftShare, QUICK_MINUTES, timeLeft, type Ampel, type Blank, type Timer } from './tools';

export interface ToolState {
  timer: Timer | null;
  now: number;
  sound: boolean;
  ampel: Ampel;
  blank: Blank;
  /** Minutes of the slide in view (0: none), offered for the timer. */
  minutes: number;
}

export interface ToolActions {
  startTimer(minutes: number): void;
  /** Stops a running timer or lets it go on. */
  toggleTimer(): void;
  addMinutes(m: number): void;
  clearTimer(): void;
  setSound(on: boolean): void;
  setAmpel(a: Ampel): void;
  setBlank(b: Blank): void;
}

/** Timer, Ampel, black and white screen as buttons; `below`: the timer panel opens downwards (speaker view). */
export function ToolButtons({ s, act, below = false, onPanel }: { s: ToolState; act: ToolActions; below?: boolean; onPanel?(open: boolean): void }) {
  const [open, setOpenState] = useState(false);
  const setOpen = (o: boolean) => {
    setOpenState(o);
    onPanel?.(o);
  };
  const { timer, now } = s;
  const left = timer ? timeLeft(timer, now) : 0;
  const running = !!timer && timer.since !== null && left > 0;
  return (
    <div className="sl-tools">
      <div className="sl-timer-wrap">
        <button
          type="button"
          className={'sl-tool sl-timer-btn' + (timer ? ' is-on' : '') + (timer && isOver(timer, now) ? ' is-over' : '')}
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          title="Timer (T)"
        >
          <Icon icon={TimerIcon} size={18} />
          <span>{timer ? clockText(left) : s.minutes ? `${s.minutes} Min.` : 'Timer'}</span>
        </button>
        {open && (
          <div className={'sl-timer-panel' + (below ? ' is-below' : '')} role="dialog" aria-label="Timer">
            {timer && (
              <div className="sl-timer-now">
                <b>{clockText(left)}</b>
                <div className="sl-timer-row">
                  {left > 0 && (
                    <button type="button" className="sl-pill" onClick={act.toggleTimer}>
                      <Icon icon={running ? Pause : Play} size={16} />
                      {running ? 'Anhalten' : 'Weiter'}
                    </button>
                  )}
                  <button type="button" className="sl-pill" onClick={() => act.addMinutes(-1)} disabled={left === 0}>
                    −1 Min.
                  </button>
                  <button type="button" className="sl-pill" onClick={() => act.addMinutes(1)}>
                    +1 Min.
                  </button>
                  <button
                    type="button"
                    className="sl-pill"
                    onClick={() => {
                      act.clearTimer();
                      setOpen(false);
                    }}
                  >
                    <Icon icon={TimerOff} size={16} />
                    Aus
                  </button>
                </div>
              </div>
            )}
            {s.minutes > 0 && (
              <button
                type="button"
                className="sl-pill is-main"
                onClick={() => {
                  act.startTimer(s.minutes);
                  setOpen(false);
                }}
              >
                <Icon icon={Play} size={16} />
                {s.minutes} Min. starten (wie auf der Folie)
              </button>
            )}
            <div className="sl-timer-row">
              {QUICK_MINUTES.map((m) => (
                <button
                  key={m}
                  type="button"
                  className="sl-pill"
                  onClick={() => {
                    act.startTimer(m);
                    setOpen(false);
                  }}
                >
                  {m} Min.
                </button>
              ))}
            </div>
            <button type="button" className="sl-pill sl-sound" onClick={() => act.setSound(!s.sound)} aria-pressed={s.sound}>
              <Icon icon={s.sound ? Volume2 : VolumeX} size={16} />
              {s.sound ? 'Gong am Ende: an' : 'Gong am Ende: aus'}
            </button>
          </div>
        )}
      </div>
      <div className="sl-ampel-btns" role="group" aria-label="Lautstärke-Ampel (A)">
        {AMPEL_LEVELS.map((a) => (
          <button
            key={a.v}
            type="button"
            className={`sl-tool sl-ampel-btn is-${a.v}` + (s.ampel === a.v ? ' is-on' : '')}
            aria-pressed={s.ampel === a.v}
            title={`Ampel: ${a.l} (A)`}
            aria-label={`Ampel: ${a.l}`}
            onClick={() => act.setAmpel(s.ampel === a.v ? '' : a.v)}
          >
            <i />
          </button>
        ))}
      </div>
      <button
        type="button"
        className={'sl-tool' + (s.blank === 'black' ? ' is-on' : '')}
        aria-pressed={s.blank === 'black'}
        title="Schwarzbild (B)"
        aria-label="Schwarzbild"
        onClick={() => act.setBlank(s.blank === 'black' ? '' : 'black')}
      >
        <Icon icon={MonitorOff} size={18} />
      </button>
      <button
        type="button"
        className={'sl-tool' + (s.blank === 'white' ? ' is-on' : '')}
        aria-pressed={s.blank === 'white'}
        title="Weißbild (W)"
        aria-label="Weißbild"
        onClick={() => act.setBlank(s.blank === 'white' ? '' : 'white')}
      >
        <Icon icon={Square} size={18} />
      </button>
    </div>
  );
}

/** What the class sees over the slide: the timer bar at the bottom edge and the Ampel. Sized with the slide (--s). */
export function ToolOverlays({ timer, now, ampel }: { timer: Timer | null; now: number; ampel: Ampel }) {
  const left = timer ? timeLeft(timer, now) : 0;
  const level = AMPEL_LEVELS.find((a) => a.v === ampel);
  return (
    <>
      {timer && (
        <div className={'sl-timebar' + (left === 0 ? ' is-over' : left <= 60_000 ? ' is-last' : '') + (timer.since === null && left > 0 ? ' is-paused' : '')} aria-label={`Restzeit ${clockText(left)}`}>
          <div className="sl-timebar-fill" style={{ width: `${leftShare(timer, now) * 100}%` }} />
          <span className="sl-timebar-time">{clockText(left)}</span>
        </div>
      )}
      {level && (
        <div className={'sl-ampel is-' + level.v} aria-label={`Ampel: ${level.l}`}>
          <div className="sl-ampel-box">
            {AMPEL_LEVELS.map((a) => (
              <i key={a.v} className={`is-${a.v}` + (a.v === ampel ? ' is-on' : '')} />
            ))}
          </div>
          <span>{level.l}</span>
        </div>
      )}
    </>
  );
}
