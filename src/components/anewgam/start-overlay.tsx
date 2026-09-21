import { Clapperboard, Eye, Heart, Shield, Sparkles } from "lucide-react";
import { asset } from "@/lib/asset";

function StartOverlay({
  onEnter,
  onWatch,
  canContinue,
}: {
  onEnter: () => void;
  onWatch: () => void;
  canContinue: boolean;
}) {
  return (
    <div className="absolute inset-0 z-20 overflow-y-auto overscroll-contain">
      <img
        src={asset("anewgam/concept.png")}
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-ink/45" />
      <div className="start-pad relative mx-auto flex min-h-dvh max-w-lg flex-col justify-end px-4 sm:justify-center sm:px-5">
        <div className="bg-hud/88 text-hud-fg shadow-hud ring-gold/40 rounded-xl px-5 py-6 ring-1 sm:px-6 sm:py-8">
          <p className="font-serif text-gold text-xs font-semibold tracking-[0.28em] uppercase">
            Oasis Dream · Knight side
          </p>
          <h1 className="font-display mt-1 text-4xl leading-none text-cream sm:text-5xl">Skyknight Raven</h1>
          <p className="font-serif text-blossom mt-1 text-sm tracking-wide">Assume Her Fragments</p>

          <p className="mt-5 max-w-sm text-base leading-snug text-cream/90 sm:text-lg">
            Do not collect them.
            <br />
            Meet them. Each returns by choice.
          </p>

          <ul className="mt-5 space-y-3 text-sm">
            <Feature icon={Shield} title="Steven the knight" copy="This is his meadow. The princess keeps her tower." />
            <Feature icon={Heart} title="Five aspects" copy="Playful, Shy, Crying, Singing, Mischievous." />
            <Feature icon={Eye} title="Dream Sight" copy="Q, or the Gaze button. Listen before you reach." />
            <Feature icon={Sparkles} title="Sit, kneel, hop" copy="Same on phone and desktop. Buttons always stay on screen." />
          </ul>

          <button
            type="button"
            onClick={onEnter}
            className="bg-gold text-ink shadow-card mt-7 h-14 w-full rounded-full text-sm font-semibold sm:mt-8 sm:h-12"
          >
            {canContinue ? "Continue the meeting" : "Start the meeting"}
          </button>
          <button
            type="button"
            onClick={onWatch}
            className="text-cream ring-gold/50 mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-full text-sm font-semibold ring-1"
          >
            <Clapperboard className="size-4" />
            Watch the play
          </button>
          <p className="text-muted mt-3 text-center text-xs leading-relaxed">
            One meadow for phone and desktop.
            <br />
            WASD or arrows walk · drag or right stick look
            <br />
            Sit · Kneel · Hop · Gaze — always on screen
          </p>
        </div>
      </div>
    </div>
  );
}

function Feature({
  icon: Icon,
  title,
  copy,
}: {
  icon: typeof Eye;
  title: string;
  copy: string;
}) {
  return (
    <li className="flex gap-3">
      <span className="bg-elevated/80 text-gold mt-0.5 grid size-9 place-items-center rounded-full">
        <Icon className="size-4" />
      </span>
      <span>
        <span className="block font-semibold tracking-wide text-cream">{title}</span>
        <span className="text-muted text-xs leading-snug">{copy}</span>
      </span>
    </li>
  );
}

export { StartOverlay };
