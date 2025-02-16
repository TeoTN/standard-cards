import { LovelaceCardHelpers } from "../types";

export type WindowWithStuff = Window & typeof globalThis & {
  loadCardHelpers: () => Promise<LovelaceCardHelpers>;
  customCards: unknown[];
}

export const getWindow = () => window as WindowWithStuff;
