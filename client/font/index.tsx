import { FontLoader } from "three-stdlib";

import type { Shape } from 'three';

// Convert a TTF file to json -- https://gero3.github.io/facetype.js/
// Restrict characters to ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@!#?.,<>:";'[]{}\|`~$%^&*()_+-=/

import * as fontJson from "./noir-pro-bold.json";

export const font = new FontLoader().parse(fontJson as any);

export const chars = keys(fontJson.glyphs);
export type Char = typeof chars[number];

export function isChar(v: unknown): v is Char {
  return chars.includes(v as Char);
}

export function keys<T extends object>(o: T): (keyof T)[] {
  return Object.keys(o) as (keyof T)[];
}

const boundingBox = Object.values(fontJson.glyphs).reduce(({ xMax, xMin }, { x_max, x_min }) => ({
  xMax: Math.max(xMax, x_max),
  xMin: Math.min(xMin, x_min)
}), { xMax: -Infinity, xMin: Infinity })

export const fontWidth: number = boundingBox.xMax - boundingBox.xMin;

export function getCenter(char: Char): number {
  const { x_max, x_min } = fontJson.glyphs[char];
  return (x_max - x_min) / 2 / fontWidth;
}

export function getWidth(char: Char): number {
  return fontJson.glyphs[char].ha;
}

export const shapes = chars.reduce((shapes, char) => {
  return { ...shapes, [char]: font.generateShapes(char, 0.75) };
}, {} as Record<Char, Shape>);
