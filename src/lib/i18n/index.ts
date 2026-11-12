import en from "./dictionaries/en.json";

export type Dictionary = typeof en;

export function getDictionary(): Dictionary {
  return en;
}

export const t = en;
