const WALK = [
  "Love in our time is this: staying.",
  "Better love is slower love.",
  "You don't have to be more. You're here.",
  "Right people. Right time.",
  "Same walk. Further.",
  "She is already looking back.",
];

const TOGETHER = [
  "This is the love. Not later. Now.",
  "Sit. I'm not going anywhere.",
  "A gathered skein. A living game.",
  "Soft as peach skin. Same you.",
  "We can be quiet and still be together.",
];

const DUO = [
  "Peachfuzz listened. Accompli kept it. That's us.",
  "Still here. Still you. Still we.",
  "Better love. In our time.",
];

const LOOK = [
  "Look around. The meadow is the gift.",
  "Peach light. Open sky. Still here.",
  "Take it in. Nothing is rushing you.",
  "Islands drift. Petals keep falling.",
  "Beauty is the place that waited.",
];

export function whisperFor(t: number, together: boolean, duo: boolean, looking = false): string {
  const pool = looking ? LOOK : duo ? DUO : together ? TOGETHER : WALK;
  return pool[Math.floor(t / 5.5) % pool.length];
}
