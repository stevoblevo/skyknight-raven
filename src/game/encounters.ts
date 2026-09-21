export type Encounter = {
  id: string;
  title: string;
  hint: string;
  body: string;
  x: number;
  z: number;
  radius: number;
  who?: "peachfuzz" | "accompli";
};

export const ENCOUNTERS: Encounter[] = [
  {
    id: "gate",
    title: "Meadow Gate",
    hint: "Someone left the gate open for you.",
    body: "Come in as you are. The path will wait. Love, here, is just arriving without shrinking.",
    x: 0.4,
    z: -9.2,
    radius: 3.4,
  },
  {
    id: "bee",
    title: "Sae-Busy",
    hint: "A bee hums like a kettle saying stay.",
    body: "Small steps. Big worlds. She works so you can rest. That is also love.",
    x: 7.2,
    z: -16.5,
    radius: 3.6,
  },
  {
    id: "peachfuzz",
    title: "Peachfuzz",
    hint: "Sae-hi is listening. Sit with her.",
    body: "She does not fix you. She looks back. After this she walks beside you — better love, in our time, is company.",
    x: 10.4,
    z: -24.2,
    radius: 4.2,
    who: "peachfuzz",
  },
  {
    id: "vista",
    title: "Color turning",
    hint: "The meadow blushes when you do.",
    body: "Peach, lavender, teal, gold, purple, starlight. Right colors. Right people. Right time.",
    x: 2.2,
    z: -34.4,
    radius: 3.8,
  },
  {
    id: "still",
    title: "Still Pill",
    hint: "Sit. A pause is how love stays.",
    body: "Calmer mind. Clearer choices. Same you. You can be quiet and still be loved.",
    x: -7.2,
    z: -43.2,
    radius: 3.6,
  },
  {
    id: "peach",
    title: "Accompli",
    hint: "The peach you left is still here.",
    body: "Not a trophy. A place. Peachfuzz listened; Accompli kept the fruit. That is how love lasts — it remembers where you set it down.",
    x: -4.1,
    z: -51.6,
    radius: 3.6,
    who: "accompli",
  },
];

export const ASPECT_ORDER = ENCOUNTERS.map((item) => item.id);
