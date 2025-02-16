import { ActionConfig, LovelaceCard, LovelaceCardConfig, LovelaceCardEditor } from 'custom-card-helpers';
import { TABS_CARD_EDITOR_TAG_NAME } from './constants';

declare global {
  interface HTMLElementTagNameMap {
    [TABS_CARD_EDITOR_TAG_NAME]: LovelaceCardEditor;
    'hui-error-card': LovelaceCard;
  }
}

// TODO Merge into the card config
export interface BoilerplateCardConfig extends LovelaceCardConfig {
  type: string;
  name?: string;
  show_warning?: boolean;
  show_error?: boolean;
  test_gui?: boolean;
  entity?: string;
  tap_action?: ActionConfig;
  hold_action?: ActionConfig;
  double_tap_action?: ActionConfig;
}

export interface LovelaceCardHelpers {
  createCardElement(config: LovelaceCardConfig): Promise<LovelaceCard>;
  importMoreInfoControl(type: string): Promise<void>;
}
