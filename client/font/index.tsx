import { FontLoader } from "three-stdlib";

import * as fontJson from "./font.json";

export const font = new FontLoader().parse(fontJson as any);

export const chars = keys(fontJson.glyphs);
export type Char = typeof chars[number];

export function isChar(v: unknown): v is Char {
  return chars.includes(v as Char);
}

export function keys<T extends object>(o: T): (keyof T)[] {
  return Object.keys(o) as (keyof T)[];
}

export function getWidth(char: Char): number {
  return fontJson.glyphs[char].ha;
}
