import {
  Armchair,
  ChevronsUp,
  Eye,
  Hand,
  Heart,
  PersonStanding,
  Sparkles,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { AnewgamGame, HudSnapshot } from "@/game/engine";
import { FRAGMENTS } from "@/game/fragments";
import { cn } from "@/lib/utils";

type HudProps = {
  game: AnewgamGame | null;
  hud: HudSnapshot;
  muted: boolean;
  onMute: () => void;
  keysReady?: boolean;
};

function Joystick({
  onChange,
  look,
}: {
  onChange: (x: number, y: number) => void;
  look?: boolean;
}) {
  const baseRef = useRef<HTMLDivElement>(null);
  const pointer = useRef<number | null>(null);

  const apply = useCallback(
    (clientX: number, clientY: number) => {
      const el = baseRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const radius = r.width / 2 - 8;
      let dx = clientX - cx;
      let dy = clientY - cy;
      const mag = Math.hypot(dx, dy);
      if (mag > radius) {
        dx = (dx / mag) * radius;
        dy = (dy / mag) * radius;
      }
      const knob = el.querySelector("[data-knob]") as HTMLDivElement | null;
      if (knob) knob.style.transform = `translate(${dx}px, ${dy}px)`;
      onChange(dx / radius, -dy / radius);
    },
    [onChange],
  );

  function end() {
    pointer.current = null;
    const el = baseRef.current;
    const knob = el?.querySelector("[data-knob]") as HTMLDivElement | null;
    if (knob) knob.style.transform = "translate(0px, 0px)";
    onChange(0, 0);
  }

  return (
    <div
      ref={baseRef}
      data-no-look
      role="slider"
      aria-label={look ? "Look around" : "Walk"}
      aria-valuemin={-1}
      aria-valuemax={1}
      aria-valuenow={0}
      className={cn("joy shadow-hud relative shrink-0 rounded-full ring-1 touch-none", look ? "bg-hud/70 ring-gold/50" : "bg-hud/80 ring-gold/40")}
      onPointerDown={(event) => {
        event.preventDefault();
        event.stopPropagation();
        pointer.current = event.pointerId;
        event.currentTarget.setPointerCapture(event.pointerId);
        apply(event.clientX, event.clientY);
      }}
      onPointerMove={(event) => {
        if (pointer.current !== event.pointerId) return;
        apply(event.clientX, event.clientY);
      }}
      onPointerUp={end}
      onPointerCancel={end}
    >
      <div className="ring-gold/35 pointer-events-none absolute inset-2.5 rounded-full ring-1 sm:inset-3" />
      <div
        data-knob
        className={cn(
          "pointer-events-none absolute top-1/2 left-1/2 flex size-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full shadow-card sm:size-11",
          look ? "bg-cream text-ink" : "bg-gold text-ink",
        )}
      >
        {look ? <Eye className="size-4 sm:size-5" /> : null}
      </div>
    </div>
  );
}

function ActionButton({
  label,
  icon: Icon,
  active,
  hold,
  onPress,
}: {
  label: string;
  icon: typeof Eye;
  active?: boolean;
  hold?: boolean;
  onPress: (pressed: boolean) => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active}
      data-no-look
      onPointerDown={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onPress(true);
      }}
      onPointerUp={() => onPress(false)}
      onPointerCancel={() => onPress(false)}
      onPointerLeave={() => {
        if (hold) onPress(false);
      }}
      className={cn(
        "pose-btn shadow-hud pointer-events-auto flex flex-col items-center justify-center rounded-2xl",
        active ? "bg-gold text-ink" : "bg-hud/90 text-cream",
      )}
    >
      <Icon className="size-5" />
      <span className="text-[10px] font-semibold tracking-wide uppercase">{label}</span>
    </button>
  );
}

function MiniMap({ hud }: { hud: HudSnapshot }) {
  const scale = 1.15;
  const toPct = (x: number, z: number) => ({
    left: `${50 + x * scale}%`,
    top: `${50 + z * scale}%`,
  });
  const rot = ((hud.yaw * 180) / Math.PI).toFixed(1);
  return (
    <div className="minimap bg-hud/80 ring-gold/40 shadow-hud relative overflow-hidden rounded-full ring-1">
      <p className="text-gold absolute top-1 left-0 w-full text-center text-[8px] font-semibold tracking-widest uppercase sm:top-1.5 sm:text-[9px]">
        Dream Realm
      </p>
      {FRAGMENTS.map((f) => {
        const met = hud.assumed.includes(f.id);
        const p = toPct(f.x, f.z);
        return (
          <span
            key={f.id}
            className={cn("absolute size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full sm:size-2", met ? "bg-heart" : "bg-gold/70")}
            style={p}
          />
        );
      })}
      <span
        className="border-cream absolute size-0 -translate-x-1/2 -translate-y-1/2 border-x-4 border-b-8 border-x-transparent"
        style={{
          ...toPct(hud.px, hud.pz),
          transform: `translate(-50%, -50%) rotate(${rot}deg)`,
        }}
      />
    </div>
  );
}

function Hud({ game, hud, muted, onMute, keysReady }: HudProps) {
  const found = hud.assumed.length;
  const [hint, setHint] = useState(true);

  useEffect(() => {
    if (hud.looking) setHint(false);
  }, [hud.looking]);

  return (
    <div className="pointer-events-none absolute inset-0 z-10 text-cream">
      {hud.watching ? (
        <>
          <div className="bg-ink/70 pointer-events-none absolute inset-x-0 top-0 h-7 sm:h-8" />
          <div className="bg-ink/70 pointer-events-none absolute inset-x-0 bottom-0 h-7 sm:h-8" />
        </>
      ) : null}
      <div className="hud-top pointer-events-auto flex items-start justify-between gap-2 sm:gap-3">
        <div className="bg-hud/82 shadow-hud ring-gold/35 max-w-[11.5rem] rounded-xl px-2.5 py-2 ring-1 sm:max-w-xs sm:px-3.5 sm:py-2.5">
          <p className="font-serif text-gold flex items-center gap-1.5 text-[10px] font-semibold tracking-[0.22em] uppercase sm:text-[11px]">
            <Sparkles className="size-3 sm:size-3.5" />
            Oasis Dream
            {hud.watching ? <span className="text-muted ml-1 tracking-wide">· Play</span> : null}
          </p>
          <div className="mt-1 flex gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Heart
                key={i}
                className={cn("size-3 sm:size-3.5", i < hud.hearts ? "text-heart fill-heart" : "text-muted")}
              />
            ))}
          </div>
          <p className="text-muted mt-1 hidden text-[10px] tracking-widest uppercase sm:block">Quest 001</p>
          <p className="font-serif text-xs font-semibold text-gold sm:text-sm">Assume Her Fragments</p>
          <p className="text-muted hidden text-xs sm:block">Gather the pieces of Sae.</p>
          <p className="mt-1 text-[11px] tabular-nums sm:mt-1.5 sm:text-xs">
            Fragments{" "}
            <span className="text-gold font-semibold">
              {String(found).padStart(2, "0")} / 05
            </span>
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <button
            type="button"
            aria-label={muted ? "Unmute" : "Mute"}
            data-no-look
            onClick={onMute}
            className="bg-hud/80 text-cream shadow-hud grid size-11 place-items-center rounded-full sm:size-10"
          >
            {muted ? <VolumeX className="size-5" /> : <Volume2 className="size-5" />}
          </button>
          <MiniMap hud={hud} />
          {hud.watching ? (
            <button
              type="button"
              data-no-look
              onClick={() => game?.takeControl()}
              className="bg-gold text-ink shadow-hud h-11 rounded-full px-3 text-xs font-semibold sm:h-10"
            >
              Take control
            </button>
          ) : null}
        </div>
      </div>

      {hud.dream ? (
        <p className="hud-look bg-gold/90 text-ink shadow-hud pointer-events-none rounded-full px-3 py-1 text-xs font-semibold tracking-wide">
          Gaze
        </p>
      ) : null}

      {hud.line ? (
        <button
          type="button"
          data-no-look
          className="hud-line pointer-events-auto z-10 flex max-w-[min(18rem,calc(100%-7.5rem))] items-end gap-2 text-left"
          onClick={() => game?.dismissLine()}
        >
          <img
            src={hud.line.portrait}
            alt=""
            className="ring-gold/50 size-12 rounded-full object-cover ring-2 sm:size-16"
          />
          <span className="bg-hud/88 ring-gold/35 shadow-hud rounded-xl px-3 py-2 ring-1">
            <span className="text-gold font-serif block text-xs font-semibold tracking-wide">{hud.line.speaker}</span>
            <span className="mt-0.5 block text-sm leading-snug text-cream">{hud.line.text}</span>
          </span>
        </button>
      ) : null}

      <div className="hud-bottom pointer-events-none">
        {hud.near ? (
          <button
            type="button"
            data-no-look
            aria-label="Meet"
            className="bg-gold text-ink shadow-hud pointer-events-auto mx-auto mb-1.5 flex h-11 items-center gap-2 rounded-full px-4 text-sm font-semibold"
            onPointerDown={(event) => {
              event.preventDefault();
              event.stopPropagation();
              game?.input.setInteract(true);
            }}
            onPointerUp={() => game?.input.setInteract(false)}
            onPointerCancel={() => game?.input.setInteract(false)}
          >
            <Hand className="size-4" />
            Meet {hud.near.title}
            <span className="key-hint-inline text-ink/70 text-[10px] tracking-wide uppercase">E</span>
          </button>
        ) : null}

        <p className="key-hint bg-hud/70 text-cream/90 mx-auto mb-1.5 rounded-full px-3 py-1 text-center text-[11px] tracking-wide">
          {hud.watching
            ? "Watching the play · move a stick or tap Take control"
            : keysReady
              ? "WASD or arrows walk · drag or right stick look · Space hop · C kneel · Z sit · Q gaze"
              : "Tap the meadow, then WASD or arrows"}
        </p>

        <div className="hud-deck pointer-events-auto">
          <Joystick onChange={(x, y) => game?.input.setStick(x, y)} />
          <div className="hud-pose">
            <ActionButton
              label="Sit"
              icon={Armchair}
              active={hud.pose === "sit"}
              onPress={(p) => {
                if (hud.watching) {
                  if (p) game?.takeControl();
                  return;
                }
                if (p) game?.input.toggleSit();
              }}
            />
            <ActionButton
              label="Kneel"
              icon={PersonStanding}
              active={hud.pose === "kneel"}
              onPress={(p) => {
                if (hud.watching) {
                  if (p) game?.takeControl();
                  return;
                }
                if (p) game?.input.toggleKneel();
              }}
            />
            <ActionButton
              label="Hop"
              icon={ChevronsUp}
              hold
              onPress={(p) => {
                if (hud.watching) {
                  if (p) game?.takeControl();
                  return;
                }
                game?.input.setHop(p);
              }}
            />
            <ActionButton
              label="Gaze"
              icon={Eye}
              active={hud.dream}
              onPress={(p) => {
                if (hud.watching) {
                  if (p) game?.takeControl();
                  return;
                }
                game?.input.setLook(p);
              }}
            />
          </div>
          <Joystick look onChange={(x, y) => game?.input.setLookStick(x, y)} />
        </div>
      </div>

      {hint && !hud.near && !hud.line ? (
        <p className="bg-hud/80 text-cream shadow-hud pointer-events-none absolute bottom-[8.75rem] left-1/2 max-w-[16rem] -translate-x-1/2 rounded-full px-3 py-1.5 text-center text-xs sm:hidden">
          Left stick walks · right looks · drag the meadow
        </p>
      ) : null}
    </div>
  );
}

export { Hud };
