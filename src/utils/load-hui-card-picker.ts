import { LovelaceCardConfig } from "custom-card-helpers";
import { LitElement } from "lit";
import { LovelaceCardHelpers } from "../types";

class _EditableCard extends LitElement {
  static getConfigElement: () => Promise<LovelaceCardConfig>;
}
type EditableCard = typeof _EditableCard;

/**
 * A hack to contort Home Assistant to execute code path which in turn
 * loads the `hui-card-picker` element. We know that editor for
 * a vertical stack card does use it.
 * 
 * @param helpers - The helpers to use to create the card
 * @see `window.loadCardHelpers`
 */
export const loadHuiCardPicker = async (helpers: LovelaceCardHelpers) => {
  if (customElements.get("hui-card-picker")) {
    return;
  }
  const card = await helpers.createCardElement({ type: "vertical-stack", cards: [] });
  // If we don't wait for it, card's ctor will be prematurely defined as HTMLElement 
  await customElements.whenDefined("hui-vertical-stack-card");
  if (!card) {
    return;
  }
  await (card.constructor as EditableCard).getConfigElement?.();
  await customElements.whenDefined("hui-card-picker");
};
