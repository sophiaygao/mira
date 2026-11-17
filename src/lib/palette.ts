/** Mira system accents — keep charts / pillars on-brand. */

export const mira = {
  forest: '#344f46',
  sage: '#789387',
  mist: '#c5d2c5',
  linen: '#f5f2ea',
  clay: '#d9a995',
  lavender: '#9992b2',
  wisteria: '#d7d0e0',
  blush: '#e9d8cf',
  seaGlass: '#dce5df',
  ink: '#29352f',
  inkSoft: '#727c75',
} as const

/** Stronger fills for bars / badges (readable on pale panels). */
export const miraChart = [
  mira.forest,
  mira.sage,
  mira.lavender,
  mira.clay,
  '#5f756c', // forest ↔ sage
  '#8a849e', // lavender soft
  '#c4a08e', // clay soft
  '#6d7f78', // mist deepened
] as const

export const miraEmotions = [
  mira.clay,
  mira.lavender,
  mira.sage,
  mira.forest,
  '#c4a08e',
  '#8a849e',
] as const

export const miraThemes = [
  mira.sage,
  mira.lavender,
  mira.forest,
  mira.clay,
  '#5f756c',
  '#8a849e',
] as const

export const miraTensions = [
  mira.clay,
  mira.lavender,
  mira.forest,
  mira.sage,
  '#c4a08e',
] as const
