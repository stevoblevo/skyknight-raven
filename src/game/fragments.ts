import { asset } from "@/lib/asset";

export type FragId = "playful" | "shy" | "crying" | "singing" | "mischievous";

export type FragmentDef = {
  id: FragId;
  title: string;
  gift: string;
  how: string;
  hint: string;
  meet: string;
  portrait: string;
  color: number;
  x: number;
  z: number;
  radius: number;
};

export const FRAGMENTS: FragmentDef[] = [
  {
    id: "playful",
    title: "Playful",
    gift: "Boosts Joy",
    how: "Chase her, then stop. She comes back when the game is over.",
    hint: "She wants a chase — then stillness.",
    meet: "You stopped. I like that.",
    portrait: asset("anewgam/frag-playful.jpg"),
    color: 0xe8c56a,
    x: 7.4,
    z: -6.2,
    radius: 8.2,
  },
  {
    id: "shy",
    title: "Shy",
    gift: "Boosts Trust",
    how: "Kneel nearby. Don't chase. Let her come.",
    hint: "Kneel. Wait. Don't look too hard.",
    meet: "You waited. I can come closer now.",
    portrait: asset("anewgam/frag-shy.jpg"),
    color: 0xf4a0c0,
    x: -9.6,
    z: -3.4,
    radius: 6.8,
  },
  {
    id: "crying",
    title: "Crying",
    gift: "Heals Pain",
    how: "Sit nearby. Don't try to fix it.",
    hint: "Sit with her. The feeling can stay.",
    meet: "You didn't make me stop. Thank you.",
    portrait: asset("anewgam/frag-crying.jpg"),
    color: 0x7eb6e8,
    x: 5.4,
    z: 6.2,
    radius: 5.8,
  },
  {
    id: "singing",
    title: "Singing",
    gift: "Boosts Hope",
    how: "Listen. Dream Sight lets you hear her.",
    hint: "Hold Dream Sight. Don't interrupt the song.",
    meet: "You heard it. The three notes.",
    portrait: asset("anewgam/frag-singing.jpg"),
    color: 0xc4a6ff,
    x: -4.8,
    z: -16.4,
    radius: 6.4,
  },
  {
    id: "mischievous",
    title: "Mischievous",
    gift: "Breaks Limits",
    how: "Crouch and sneak. Walking startles her.",
    hint: "Sneak up gently to avoid startling the fragments.",
    meet: "Caught me. Fine. You can have the gauntlet back.",
    portrait: asset("anewgam/frag-mischief.jpg"),
    color: 0xe07a9a,
    x: 10.4,
    z: -20.6,
    radius: 6.6,
  },
];

export const FRAG_ORDER: FragId[] = ["playful", "shy", "crying", "singing", "mischievous"];

export function fragmentById(id: string): FragmentDef | undefined {
  return FRAGMENTS.find((f) => f.id === id);
}
