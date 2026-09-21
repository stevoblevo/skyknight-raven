import { useCallback, useEffect, useRef, useState } from "react";
import { Hud } from "@/components/anewgam/hud";
import { StartOverlay } from "@/components/anewgam/start-overlay";
import { AnewgamGame, type HudSnapshot } from "@/game/engine";

const EMPTY: HudSnapshot = {
  started: false,
  pose: "stand",
  near: null,
  assumed: [],
  dream: false,
  looking: false,
  hint: "Meet them. Do not collect them.",
  line: null,
  assembled: false,
  canContinue: false,
  px: 0,
  pz: 8.6,
  yaw: 0,
  hearts: 0,
  watching: false,
};

function AnewgamApp() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<AnewgamGame | null>(null);
  const pendingEnter = useRef<false | "play" | "watch">(false);
  const [hud, setHud] = useState<HudSnapshot>(EMPTY);
  const [muted, setMuted] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [keysReady, setKeysReady] = useState(false);

  const grabFocus = useCallback(() => {
    wrapRef.current?.focus();
    canvasRef.current?.focus();
    setKeysReady(true);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const game = new AnewgamGame(canvas, setHud);
    gameRef.current = game;
    game.startLoop();
    setMuted(game.isMuted());
    if (pendingEnter.current) {
      const mode = pendingEnter.current;
      pendingEnter.current = false;
      game.enter(mode);
      grabFocus();
    }
    return () => {
      game.dispose();
      gameRef.current = null;
    };
  }, [grabFocus]);

  useEffect(() => {
    if (!hud.started) return;
    grabFocus();
    const t = window.setTimeout(grabFocus, 40);
    return () => window.clearTimeout(t);
  }, [hud.started, grabFocus]);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const onFocus = () => setKeysReady(true);
    const onBlur = (event: FocusEvent) => {
      const next = event.relatedTarget as Node | null;
      if (next && wrap.contains(next)) return;
      setKeysReady(false);
    };
    wrap.addEventListener("focusin", onFocus);
    wrap.addEventListener("focusout", onBlur);
    return () => {
      wrap.removeEventListener("focusin", onFocus);
      wrap.removeEventListener("focusout", onBlur);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !hud.started) return;
    let pid: number | null = null;
    let lastX = 0;
    let lastY = 0;
    let originX = 0;
    let originY = 0;
    let armed = false;
    const THRESH = 4;
    const MAX = 72;

    const stopLook = () => {
      armed = false;
      if (gameRef.current) gameRef.current.input.lookPointer = false;
      setDragging(false);
    };

    const end = (event: PointerEvent) => {
      if (pid !== event.pointerId) return;
      pid = null;
      stopLook();
    };

    const down = (event: PointerEvent) => {
      if (event.pointerType === "mouse" && event.button !== 0) return;
      const target = event.target as HTMLElement | null;
      if (target?.closest("button, a, input, textarea, [data-no-look]")) return;
      pid = event.pointerId;
      lastX = event.clientX;
      lastY = event.clientY;
      originX = event.clientX;
      originY = event.clientY;
      armed = false;
      grabFocus();
    };

    const move = (event: PointerEvent) => {
      if (pid !== event.pointerId) return;
      let dx = event.clientX - lastX;
      let dy = event.clientY - lastY;
      lastX = event.clientX;
      lastY = event.clientY;
      if (!armed) {
        if (Math.hypot(event.clientX - originX, event.clientY - originY) < THRESH) return;
        armed = true;
        if (gameRef.current) gameRef.current.input.lookPointer = true;
        setDragging(true);
      }
      if (dx > MAX) dx = MAX;
      else if (dx < -MAX) dx = -MAX;
      if (dy > MAX) dy = MAX;
      else if (dy < -MAX) dy = -MAX;
      gameRef.current?.input.addLookDelta(dx, dy);
    };

    canvas.addEventListener("pointerdown", down);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", end);
    window.addEventListener("pointercancel", end);
    return () => {
      canvas.removeEventListener("pointerdown", down);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", end);
      window.removeEventListener("pointercancel", end);
      if (gameRef.current) gameRef.current.input.lookPointer = false;
    };
  }, [hud.started, grabFocus]);

  const enter = useCallback((mode: "play" | "watch" = "play") => {
    if (gameRef.current) gameRef.current.enter(mode);
    else pendingEnter.current = mode;
    grabFocus();
  }, [grabFocus]);

  return (
    <div
      ref={wrapRef}
      tabIndex={0}
      className="bg-bg relative h-dvh w-full overflow-hidden overscroll-none select-none outline-none"
      style={{ touchAction: "none" }}
      onPointerDown={grabFocus}
      onKeyDown={(event) => {
        if (gameRef.current?.input.ingest(event.nativeEvent, true)) grabFocus();
      }}
      onKeyUp={(event) => {
        gameRef.current?.input.ingest(event.nativeEvent, false);
      }}
    >
      <canvas
        ref={canvasRef}
        tabIndex={0}
        className={`absolute inset-0 h-full w-full touch-none outline-none ${dragging ? "cursor-grabbing" : "cursor-grab"}`}
      />
      {hud.started ? (
        <Hud
          game={gameRef.current}
          hud={hud}
          muted={muted}
          keysReady={keysReady}
          onMute={() => {
            const next = !muted;
            setMuted(next);
            gameRef.current?.setMuted(next);
          }}
        />
      ) : (
        <StartOverlay onEnter={() => enter("play")} onWatch={() => enter("watch")} canContinue={hud.canContinue} />
      )}
    </div>
  );
}

export { AnewgamApp };
