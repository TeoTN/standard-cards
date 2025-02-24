import {
  getLovelace,
  HomeAssistant,
  LovelaceCard,
  LovelaceCardEditor
} from 'custom-card-helpers';
import { css, CSSResultGroup, html, LitElement, nothing, TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { TABS_CARD_NAME } from './constants';
import { TABS_CARD_EDITOR_TAG_NAME } from './constants';
import { TABS_CARD_TAG_NAME } from './constants';
import { localize } from '../../localize/localize';
import { getInitialConfig, Tab, TabsCardConfig } from './tabs-card.config';
import { getWindow } from '../../utils/get-window';
import { registerCustomCard } from '../../utils/register-card';
import { LovelaceCardHelpers } from '../../types';
import { printVersion } from '../../utils/print-version';
import { getDeferred } from '../../utils/get-deferred';
import '../../components/tabs';
import '../../components/tab';

printVersion();

registerCustomCard({
  type: TABS_CARD_TAG_NAME,
  name: TABS_CARD_NAME,
  description: "Use this card to display multiple tabs of different cards.",
});

const handleError = (error: Error) => {
  console.error(error);
};

const waitUntil = <T>(getter: () => T, predicate: (value: T) => boolean): Promise<void> => {
  const value = getter();
  const { promise, resolve } = getDeferred<void>();
  let interval = 0;
  if (!predicate(value)) {
    interval = window.setInterval(() => {
      const value = getter();
      if (predicate(value)) {
        clearInterval(interval);
        resolve();
      }
    }, 100);
  } else {
    resolve();
  }
  return promise;
};

@customElement(TABS_CARD_TAG_NAME)
export class StandardCardTabs extends LitElement {
  // TODO Add any properities that should cause your element to re-render here
  // https://lit.dev/docs/components/properties/
  private _hass?: HomeAssistant;

  @property({ attribute: false })
  public get hass(): HomeAssistant {
    return this._hass!;
  }

  public set hass(value: HomeAssistant) {
    this._hass = value;
    // Update all child cards when hass changes
    Object.values(this.cardElements).forEach((card) => {
      card.hass = value;
    });
  }

  @state() private cardElements: Record<string, LovelaceCard> = {};
  @state() private helpers: LovelaceCardHelpers | null = null;
  @state() private config: TabsCardConfig = getInitialConfig();
  @state() private selectedTabIndex = 0;

  public static async getConfigElement(): Promise<LovelaceCardEditor> {
    await import('../../standard-card-tabs.editor.js');
    return document.createElement(TABS_CARD_EDITOR_TAG_NAME) as LovelaceCardEditor;
  }

  public static getStubConfig(): TabsCardConfig {
    return getInitialConfig();
  }

  // https://lit.dev/docs/components/properties/#accessors-custom
  public setConfig(config: TabsCardConfig): void {
    // TODO Check for required fields and that they are of the proper format
    if (!config) {
      throw new Error(localize('common.invalid_configuration'));
    }

    if (config.test_gui) {
      getLovelace().setEditMode(true);
    }

    this.config = config;
  }

  public connectedCallback() {
    super.connectedCallback();
    if (this.helpers) {
      return;
    }

    getWindow().loadCardHelpers().then(helpers => {
      this.helpers = helpers;
      if (!customElements.get("mwc-tab-bar")) {
        // Trick to import `mwc-tab-bar` and `mwc-bar` without build tools shenanigans
        helpers.importMoreInfoControl("weather")
      }
    });
  }

  protected firstUpdated() {
    const currentTab = this.config.tabs[this.selectedTabIndex];
    if (!currentTab) {
      return;
    }
    this.prepareCardElement(currentTab).catch(handleError);
  }

  // https://lit.dev/docs/components/rendering/
  protected render(): TemplateResult {
    if (this.config.show_warning) {
      return this._showWarning(localize('common.show_warning'));
    }

    if (this.config.show_error) {
      return this._showError(localize('common.show_error'));
    }

    const { tabs = [] } = this.config;
    const activeTab = tabs[this.selectedTabIndex];
    const currentCard = activeTab ? this.cardElements[activeTab.id] : null;

    return html`
      <div class="card-content">
        ${this.toolbarTemplate(tabs)}
        ${currentCard ? html`
          <div class="tab-body">
            ${currentCard}
          </div>
        ` : nothing}
      </div>
    `;
  }

  private toolbarTemplate(tabs: ReadonlyArray<Tab>): TemplateResult {
    return html`
      <std-ui-tabs
        .activeIndex=${this.selectedTabIndex}
        @selected=${this.onTabActivated}
      >
        ${tabs.map((tab) => html`
          <std-ui-tab>${tab.label}</std-ui-tab>
        `)}
      </std-ui-tabs>
    `;
  }

  private onTabActivated(e: CustomEvent) {
    const index = e.detail.index;
    this.selectedTabIndex = index;
    const currentTab = this.config.tabs[this.selectedTabIndex];
    if (!currentTab) {
      return;
    }
    this.prepareCardElement(currentTab).catch(handleError);
  }

  private async prepareCardElement(tab: Tab): Promise<void> {
    await waitUntil(() => this.helpers, (helpers) => helpers !== null);
    if (!tab.id) {
      throw new Error("Tab has no id");
    }
    if (this.cardElements[tab.id]) {
      return;
    }

    const element = await this.helpers!.createCardElement(tab.card);
    if (!element) {
      throw new Error("Failed to create card element");
    }
    element.hass = this.hass;
    this.cardElements[tab.id] = element;
    this.requestUpdate();
  }

  private _showWarning(warning: string): TemplateResult {
    return html` <hui-warning>${warning}</hui-warning> `;
  }

  private _showError(error: string): TemplateResult {
    const errorCard = document.createElement('hui-error-card');
    errorCard.setConfig({
      type: 'error',
      error,
      origConfig: this.config,
    });

    return html` ${errorCard} `;
  }

  // https://lit.dev/docs/components/styles/
  static get styles(): CSSResultGroup {
    return css`
      .card-content {
        display: flex;
        flex-direction: column;
        gap: 16px;
        max-width: 100%;
        max-height: 100%;
        overflow: hidden;
      }

      .tab-body {
        width: 100%;
      }
    `;
  }

  public async getGridOptions() {
    const size = await this.getCardSize();
    return {
      columns: 'full',
      rows: size,
    };
  }

  public async getCardSize(): Promise<number> {
    const TAB_BAR_HEIGHT = 2;
    const activeTab = this.config.tabs[this.selectedTabIndex];
    const currentCard = activeTab ? this.cardElements[activeTab.id] : null;
    const cardSize = currentCard && 'getCardSize' in currentCard
      ? (await currentCard.getCardSize?.()) ?? 1
      : 1;
    return TAB_BAR_HEIGHT + cardSize;
  }
}
