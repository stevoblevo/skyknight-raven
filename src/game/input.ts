const GAME_CODES = new Set([
  "KeyW",
  "KeyA",
  "KeyS",
  "KeyD",
  "ArrowUp",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "Space",
  "KeyC",
  "KeyX",
  "KeyE",
  "KeyZ",
  "KeyI",
  "KeyJ",
  "KeyK",
  "KeyL",
  "KeyQ",
  "ShiftLeft",
  "ShiftRight",
]);

const KEY_ALIAS: Record<string, string> = {
  w: "KeyW",
  a: "KeyA",
  s: "KeyS",
  d: "KeyD",
  e: "KeyE",
  c: "KeyC",
  x: "KeyX",
  z: "KeyZ",
  i: "KeyI",
  j: "KeyJ",
  k: "KeyK",
  l: "KeyL",
  q: "KeyQ",
  " ": "Space",
  arrowup: "ArrowUp",
  arrowdown: "ArrowDown",
  arrowleft: "ArrowLeft",
  arrowright: "ArrowRight",
  shift: "ShiftLeft",
};

function resolveCode(event: KeyboardEvent): string | null {
  const code = event.code;
  if (code && GAME_CODES.has(code)) return code;
  const key = (event.key || "").toLowerCase();
  if (key && KEY_ALIAS[key]) return KEY_ALIAS[key];
  const codeKey = (code || "").toLowerCase();
  if (codeKey && KEY_ALIAS[codeKey]) return KEY_ALIAS[codeKey];
  return null;
}

function radialDeadzone(x: number, y: number, dz = 0.15): { x: number; y: number } {
  const m = Math.hypot(x, y);
  if (m < dz) return { x: 0, y: 0 };
  const scale = (m - dz) / (1 - dz) / m;
  return { x: x * scale, y: y * scale };
}

export type GameActions = {
  moveX: number;
  moveY: number;
  hop: boolean;
  kneel: boolean;
  sit: boolean;
  look: boolean;
  lookX: number;
  lookY: number;
  lookDx: number;
  lookDy: number;
};

export class InputMap {
  private keys = new Set<string>();
  private injected: string[] | null = null;
  private stick = { x: 0, y: 0 };
  private lookStick = { x: 0, y: 0 };
  private lookDelta = { x: 0, y: 0 };
  private hopBtn = false;
  private lookBtn = false;
  private interactBtn = false;
  lookPointer = false;
  private prevHop = false;
  private prevLook = false;
  private prevKneel = false;
  private prevSit = false;
  private prevInteract = false;
  kneelHeld = false;
  sitHeld = false;
  private prevKneelKey = false;
  private prevSitKey = false;

  attach(root?: HTMLElement | null): () => void {
    const onDown = (event: Event) => this.ingest(event as KeyboardEvent, true);
    const onUp = (event: Event) => this.ingest(event as KeyboardEvent, false);
    const clear = () => this.keys.clear();
    const opts: AddEventListenerOptions = { capture: true };
    const targets: EventTarget[] = [window, document];
    if (root) targets.push(root);
    for (const t of targets) {
      t.addEventListener("keydown", onDown, opts);
      t.addEventListener("keyup", onUp, opts);
    }
    window.addEventListener("blur", clear);
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) clear();
    });
    return () => {
      for (const t of targets) {
        t.removeEventListener("keydown", onDown, opts);
        t.removeEventListener("keyup", onUp, opts);
      }
      window.removeEventListener("blur", clear);
    };
  }

  ingest(event: KeyboardEvent, down: boolean): boolean {
    const code = resolveCode(event);
    if (!code) return false;
    event.preventDefault();
    event.stopPropagation();
    if (down) this.keys.add(code);
    else {
      this.keys.delete(code);
      this.keys.delete(event.code);
    }
    return true;
  }

  press(code: string): void {
    this.keys.add(code);
  }

  release(code: string): void {
    this.keys.delete(code);
  }

  setStick(x: number, y: number): void {
    const v = radialDeadzone(x, y);
    this.stick.x = v.x;
    this.stick.y = v.y;
  }

  setLookStick(x: number, y: number): void {
    const v = radialDeadzone(x, y, 0.12);
    this.lookStick.x = v.x;
    this.lookStick.y = v.y;
  }

  addLookDelta(dx: number, dy: number): void {
    this.lookDelta.x += dx;
    this.lookDelta.y += dy;
  }

  setHop(pressed: boolean): void {
    this.hopBtn = pressed;
  }

  setLook(pressed: boolean): void {
    this.lookBtn = pressed;
  }

  setInteract(pressed: boolean): void {
    this.interactBtn = pressed;
  }

  toggleKneel(): void {
    this.kneelHeld = !this.kneelHeld;
    if (this.kneelHeld) this.sitHeld = false;
  }

  toggleSit(): void {
    this.sitHeld = !this.sitHeld;
    if (this.sitHeld) this.kneelHeld = false;
  }

  standUp(): void {
    this.sitHeld = false;
    this.kneelHeld = false;
  }

  setKeys(codes: string[]): void {
    this.injected = codes.length > 0 ? codes : null;
  }

  playerIntent(): boolean {
    if (this.injected) return false;
    if (this.keys.size > 0) return true;
    if (Math.hypot(this.stick.x, this.stick.y) > 0.18) return true;
    if (Math.hypot(this.lookStick.x, this.lookStick.y) > 0.18) return true;
    if (this.lookPointer) return true;
    if (this.hopBtn || this.interactBtn) return true;
    return false;
  }

  sample(): GameActions & {
    hopPressed: boolean;
    lookPressed: boolean;
    kneelPressed: boolean;
    sitPressed: boolean;
    interactPressed: boolean;
  } {
    const held = this.injected ? new Set(this.injected) : this.keys;
    let moveX = this.injected ? 0 : this.stick.x;
    let moveY = this.injected ? 0 : this.stick.y;
    if (held.has("KeyA") || held.has("ArrowLeft")) moveX -= 1;
    if (held.has("KeyD") || held.has("ArrowRight")) moveX += 1;
    if (held.has("KeyW") || held.has("ArrowUp")) moveY += 1;
    if (held.has("KeyS") || held.has("ArrowDown")) moveY -= 1;

    const pad = this.readPad();
    moveX += pad.x;
    moveY += pad.y;

    const mag = Math.hypot(moveX, moveY);
    if (mag > 1) {
      moveX /= mag;
      moveY /= mag;
    }

    let lookX = this.injected ? 0 : this.lookStick.x + pad.lookX;
    let lookY = this.injected ? 0 : this.lookStick.y + pad.lookY;
    if (held.has("KeyJ")) lookX -= 1;
    if (held.has("KeyL")) lookX += 1;
    if (held.has("KeyI")) lookY += 1;
    if (held.has("KeyK")) lookY -= 1;
    const lookMag = Math.hypot(lookX, lookY);
    if (lookMag > 1) {
      lookX /= lookMag;
      lookY /= lookMag;
    }

    const lookDx = this.injected ? 0 : this.lookDelta.x;
    const lookDy = this.injected ? 0 : this.lookDelta.y;
    this.lookDelta.x = 0;
    this.lookDelta.y = 0;

    const hop = this.hopBtn || held.has("Space") || pad.hop;
    const look = this.lookBtn || held.has("KeyQ") || pad.look;
    const interact = this.interactBtn || held.has("KeyE");
    const kneelKey = held.has("KeyC") || held.has("ShiftLeft") || held.has("ShiftRight");
    const sitKey = held.has("KeyZ") || held.has("KeyX");
    if (kneelKey && !this.prevKneelKey) this.toggleKneel();
    if (sitKey && !this.prevSitKey) this.toggleSit();
    this.prevKneelKey = kneelKey;
    this.prevSitKey = sitKey;

    const hopPressed = hop && !this.prevHop;
    const lookPressed = look && !this.prevLook;
    const interactPressed = interact && !this.prevInteract;
    const kneelPressed = this.kneelHeld && !this.prevKneel;
    const sitPressed = this.sitHeld && !this.prevSit;
    this.prevHop = hop;
    this.prevLook = look;
    this.prevInteract = interact;
    this.prevKneel = this.kneelHeld;
    this.prevSit = this.sitHeld;

    return {
      moveX,
      moveY,
      hop,
      kneel: this.kneelHeld,
      sit: this.sitHeld,
      look,
      lookX,
      lookY,
      lookDx,
      lookDy,
      hopPressed,
      lookPressed,
      kneelPressed,
      sitPressed,
      interactPressed,
    };
  }

  private readPad(): { x: number; y: number; hop: boolean; look: boolean; lookX: number; lookY: number } {
    const pads = navigator.getGamepads?.() ?? [];
    for (const pad of pads) {
      if (!pad || pad.mapping !== "standard") continue;
      const v = radialDeadzone(pad.axes[0] ?? 0, -(pad.axes[1] ?? 0));
      const look = radialDeadzone(pad.axes[2] ?? 0, -(pad.axes[3] ?? 0), 0.18);
      return {
        x: v.x,
        y: v.y,
        hop: Boolean(pad.buttons[0]?.pressed),
        look: Boolean(pad.buttons[2]?.pressed),
        lookX: look.x,
        lookY: look.y,
      };
    }
    return { x: 0, y: 0, hop: false, look: false, lookX: 0, lookY: 0 };
  }
}
