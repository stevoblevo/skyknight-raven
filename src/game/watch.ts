type Line = { speaker: string; text: string; portrait: string };

export type WatchPose = "stand" | "kneel" | "sit";

export type WatchStep =
  | { t: "look"; pitch: number; yaw: number; hold: number; line?: Line }
  | { t: "go"; x: number; z: number; pose?: WatchPose; dream?: boolean; line?: Line }
  | { t: "hold"; hold: number; pose?: WatchPose; dream?: boolean; line?: Line };

export type WatchDrive = {
  moveX: number;
  moveY: number;
  pose: WatchPose;
  dream: boolean;
  lookYaw: number | null;
  lookPitch: number | null;
  line: Line | null;
  looped: boolean;
};

const PORTRAIT = "/anewgam/sae-portrait.jpg";

export const WATCH_STEPS: WatchStep[] = [
  {
    t: "look",
    pitch: 0.4,
    yaw: 0,
    hold: 3.4,
    line: {
      speaker: "Skyknight Raven",
      text: "Watch the play. The meadow remembers.",
      portrait: PORTRAIT,
    },
  },
  { t: "go", x: 0.4, z: -7.2 },
  {
    t: "look",
    pitch: 0.18,
    yaw: 0.95,
    hold: 2.2,
    line: { speaker: "Sae", text: "Little pieces of me, in the flowers.", portrait: PORTRAIT },
  },
  { t: "look", pitch: 0.16, yaw: -1.05, hold: 2.1 },
  {
    t: "go",
    x: 6.4,
    z: -5.4,
    line: { speaker: "Playful", text: "Catch me — then stop.", portrait: "/anewgam/frag-playful.jpg" },
  },
  { t: "hold", hold: 2.6 },
  { t: "go", x: -8.2, z: -2.8 },
  {
    t: "hold",
    pose: "kneel",
    hold: 3.4,
    line: { speaker: "Shy", text: "Kneel. Wait. Don't look too hard.", portrait: "/anewgam/frag-shy.jpg" },
  },
  { t: "go", x: 4.8, z: 5.2, pose: "stand" },
  {
    t: "hold",
    pose: "sit",
    hold: 3.5,
    line: { speaker: "Crying", text: "Sit with her. The feeling can stay.", portrait: "/anewgam/frag-crying.jpg" },
  },
  { t: "go", x: -4.2, z: -15.0, pose: "stand" },
  {
    t: "hold",
    dream: true,
    hold: 3.4,
    line: { speaker: "Singing", text: "Listen. Three notes in the dusk.", portrait: "/anewgam/frag-singing.jpg" },
  },
  { t: "go", x: 9.4, z: -19.2, pose: "kneel" },
  {
    t: "hold",
    pose: "kneel",
    hold: 2.8,
    line: {
      speaker: "Mischievous",
      text: "Sneak. Walking startles the fragments.",
      portrait: "/anewgam/frag-mischief.jpg",
    },
  },
  { t: "go", x: 0.2, z: -11.5, pose: "stand" },
  {
    t: "look",
    pitch: 0.38,
    yaw: 0,
    hold: 5.2,
    line: { speaker: "Sae", text: "Steven… I made it farther this time.", portrait: "/anewgam/sae-adult.jpg" },
  },
];

export class WatchPlay {
  private i = 0;
  private hold = 0;
  private announced = -1;

  reset(): void {
    this.i = 0;
    this.hold = 0;
    this.announced = -1;
  }

  drive(
    dt: number,
    pos: { x: number; z: number },
    camYaw: number,
  ): WatchDrive {
    let looped = false;
    if (this.i >= WATCH_STEPS.length) {
      this.reset();
      looped = true;
    }
    const step = WATCH_STEPS[this.i];
    let moveX = 0;
    let moveY = 0;
    let pose: WatchPose = "stand";
    let dream = false;
    let lookYaw: number | null = null;
    let lookPitch: number | null = null;
    let line: Line | null = null;

    if (this.announced !== this.i && step.line) {
      line = step.line;
      this.announced = this.i;
    }

    if (step.t === "look") {
      lookYaw = step.yaw;
      lookPitch = step.pitch;
      this.hold += dt;
      if (this.hold >= step.hold) {
        this.hold = 0;
        this.i += 1;
      }
    } else if (step.t === "go") {
      pose = step.pose ?? "stand";
      dream = Boolean(step.dream);
      const dx = step.x - pos.x;
      const dz = step.z - pos.z;
      const dist = Math.hypot(dx, dz);
      if (dist < 1.15) {
        this.hold = 0;
        this.i += 1;
      } else {
        const wdx = dx / dist;
        const wdz = dz / dist;
        const fx = -Math.sin(camYaw);
        const fz = -Math.cos(camYaw);
        const rx = Math.cos(camYaw);
        const rz = -Math.sin(camYaw);
        moveY = fx * wdx + fz * wdz;
        moveX = rx * wdx + rz * wdz;
        const mag = Math.hypot(moveX, moveY) || 1;
        moveX /= mag;
        moveY /= mag;
      }
    } else {
      pose = step.pose ?? "stand";
      dream = Boolean(step.dream);
      this.hold += dt;
      if (this.hold >= step.hold) {
        this.hold = 0;
        this.i += 1;
      }
    }

    return { moveX, moveY, pose, dream, lookYaw, lookPitch, line, looped };
  }
}
