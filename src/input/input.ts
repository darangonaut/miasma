import type { Input } from '@/game/game';

const KEYS: Record<string, keyof Input> = {
  ArrowLeft: 'left',
  KeyA: 'left',
  ArrowRight: 'right',
  KeyD: 'right',
  ArrowDown: 'down',
  KeyS: 'down',
  Space: 'jump',
  ArrowUp: 'jump',
  KeyW: 'jump',
  KeyZ: 'jump',
  ShiftLeft: 'flare',
  ShiftRight: 'flare',
  KeyX: 'flare',
  KeyK: 'flare',
  KeyC: 'spark',
  KeyF: 'spark',
  KeyJ: 'spark',
};

/** Klávesnica a dotykové tlačidlá → stav ovládania. */
export class Controls {
  private keys = new Set<keyof Input>();
  private touch = new Map<number, keyof Input>();
  /** Zavolá sa pri prvom dotyku (zobrazí tlačidlá). */
  onTouch: (() => void) | null = null;
  touchMode = false;

  constructor(buttons: HTMLElement) {
    window.addEventListener('keydown', (e) => {
      const action = KEYS[e.code];
      if (!action) return;
      e.preventDefault();
      this.keys.add(action);
    });
    window.addEventListener('keyup', (e) => {
      const action = KEYS[e.code];
      if (action) this.keys.delete(action);
    });
    window.addEventListener('blur', () => this.reset());

    // Tlačidlá: prst môže prejsť z jedného na druhé (napr. zo šípky na skok).
    const update = (e: PointerEvent) => {
      const el = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null;
      const action = el?.closest<HTMLElement>('[data-action]')?.dataset.action as
        keyof Input | undefined;
      if (action) this.touch.set(e.pointerId, action);
      else this.touch.delete(e.pointerId);
      this.refreshButtons(buttons);
    };
    buttons.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      if (!this.touchMode) {
        this.touchMode = true;
        this.onTouch?.();
      }
      buttons.setPointerCapture?.(e.pointerId);
      update(e);
    });
    buttons.addEventListener('pointermove', (e) => {
      if (this.touch.has(e.pointerId) || e.buttons) update(e);
    });
    const end = (e: PointerEvent) => {
      this.touch.delete(e.pointerId);
      this.refreshButtons(buttons);
    };
    buttons.addEventListener('pointerup', end);
    buttons.addEventListener('pointercancel', end);
    window.addEventListener('touchstart', () => {
      if (!this.touchMode) {
        this.touchMode = true;
        this.onTouch?.();
      }
    });
  }

  private refreshButtons(buttons: HTMLElement): void {
    const active = new Set(this.touch.values());
    for (const el of buttons.querySelectorAll<HTMLElement>('[data-action]'))
      el.classList.toggle('down', active.has(el.dataset.action as keyof Input));
  }

  read(): Input {
    const active = new Set<keyof Input>([...this.keys, ...this.touch.values()]);
    return {
      left: active.has('left'),
      right: active.has('right'),
      down: active.has('down'),
      jump: active.has('jump'),
      flare: active.has('flare'),
      spark: active.has('spark'),
    };
  }

  reset(): void {
    this.keys.clear();
    this.touch.clear();
  }
}
