/* eslint-disable @typescript-eslint/no-explicit-any */
import { LitElement, html, TemplateResult, css, CSSResultGroup } from 'lit';
import { HomeAssistant, LovelaceCardEditor, LovelaceConfig } from 'custom-card-helpers';
import { customElement, property, state, query } from 'lit/decorators.js';
import { TABS_CARD_EDITOR_TAG_NAME } from './constants';
import { Tab, tabFormSchema, Tabs, TabsCardConfig, tabsCardConfigStruct } from './tabs-card.config';
import { assert } from 'superstruct';
import { getUniqueId } from './utils/get-unique-id';
import { LovelaceCardHelpers } from './types';
import { getWindow } from './utils/get-window';

@customElement(TABS_CARD_EDITOR_TAG_NAME)
export class StandardCardTabsEditor extends LitElement implements LovelaceCardEditor {
  @property({ attribute: false }) public hass?: HomeAssistant;
  @property({ attribute: false }) public lovelace?: LovelaceConfig;

  @state() private config?: TabsCardConfig;
  @state() private helpers?: LovelaceCardHelpers;
  @state() private selectedTabIndex = -1;
  @state() private guiMode = true;
  @state() private guiModeAvailable? = true;
  @state() private newTabSkeleton: Pick<Tab, 'id' | 'label'> = { id: getUniqueId(), label: `Tab 1` };

  @query("hui-card-element-editor") protected cardEditorEl?: any;

  public connectedCallback() {
    super.connectedCallback();
    if (this.helpers) {
      return;
    }

    getWindow().loadCardHelpers().then(helpers => {
      this.helpers = helpers;
    });
  }

  public setConfig(config: TabsCardConfig): void {
    assert(config, tabsCardConfigStruct);
    this.config = config;
  }

  get _show_warning(): boolean {
    return this.config?.show_warning || false;
  }

  get _show_error(): boolean {
    return this.config?.show_error || false;
  }

  protected render(): TemplateResult | void {
    if (!this.hass || !this.helpers) {
      return html``;
    }

    return html`
      ${this.toolbarTemplate()}
      <div class="editor">
        ${this.editorTemplate()}
      </div>
    `;
  }

  protected toolbarTemplate(): TemplateResult {
    const tabs: Tabs = this.config?.tabs ?? [];
    return html`
      <div class="toolbar">
        <paper-tabs
          .selected=${this.selectedTabIndex}
          @selected-changed=${this.onSelectedTabChanged}
        >
          ${tabs.map(({ label }, index) => html`
            <paper-tab>
              ${index + 1}. ${label}
            </paper-tab>
          `)}
          <paper-tab id="add-tab">
            <ha-icon icon="mdi:plus"></ha-icon>
          </paper-tab>
        </paper-tabs>
      </div>
    `;
  }

  protected editorTemplate(): TemplateResult {
    const tabs: Tabs = this.config?.tabs ?? [];
    if (this.selectedTabIndex === tabs.length) {
      return this.addTabTemplate();
    } else if (this.selectedTabIndex >= 0 && this.selectedTabIndex < tabs.length) {
      return this.editTabTemplate(tabs[this.selectedTabIndex]);
    } else {
      return html`
        <div id="no-tab-selected">
          Select a tab to edit or click + to add a new one
        </div>
      `;
    }
  }

  protected addTabTemplate(): TemplateResult {
    const tabs: Tabs = this.config?.tabs ?? [];
    const index = tabs.length;

    const huiCardPicker = customElements.get("hui-card-picker");
    if (!huiCardPicker) {
      console.warn("hui-card-picker is not defined");
    }

    return html`
      <h2>New Tab</h2>
      <ha-form
        .hass=${this.hass}
        .data=${this.newTabSkeleton}
        .schema=${tabFormSchema}
        .computeLabel=${this.computeFormLabelCallback}
        @value-changed=${this.onTabFormValueChanged}
      ></ha-form>
      <hui-card-picker
        .hass=${this.hass}
        .lovelace=${this.lovelace}
        @config-changed=${e => this.onTabCardChanged(e, index)}
      ></hui-card-picker>
    `;
  }

  protected editTabTemplate(tab: Tab): TemplateResult {
    return html`
      <h2>Edit Tab</h2>
      <div class="tab-toolset">
        <mwc-button @click=${() => this.onRemoveTab(this.selectedTabIndex)}>
          Remove Tab
        </mwc-button>
      </div>
      <ha-form
        .hass=${this.hass}
        .data=${tab}
        .schema=${tabFormSchema}
        .computeLabel=${this.computeFormLabelCallback}
        @value-changed=${this.onTabFormValueChanged}
      ></ha-form>
      <div class="card-config">
        <hui-card-element-editor
          .hass=${this.hass}
          .lovelace=${this.lovelace}
          .value=${tab.card}
          @GUImode-changed=${this.onGuiModeChanged}
          @config-changed=${e => this.onTabCardChanged(e, this.selectedTabIndex)}
        ></hui-card-element-editor>
      </div>  
    `;
  }

  protected computeFormLabelCallback = (schema: { name: string }): string =>
    this.hass!.localize(`ui.panel.lovelace.editor.card.tabs.${schema.name}`);

  private onSelectedTabChanged(ev: CustomEvent): void {
    console.log('onSelectedTabChanged', ev.detail.value);
    if (typeof ev.detail.value !== 'number') {
      return;
    }
    const tabs = this.config?.tabs ?? [];
    if (ev.detail.value === tabs.length) {
      this.newTabSkeleton = { id: getUniqueId(), label: `Tab ${tabs.length + 1}` };
    }
    this.selectedTabIndex = ev.detail.value;
  }

  protected onTabFormValueChanged(ev: CustomEvent): void {
    if (!this.config || ev.detail.value === undefined) return;

    if (this.selectedTabIndex === this.config.tabs.length) {
      // We're editing a new tab, don't update config yet
      return;
    }

    const tabs = [...this.config.tabs];
    tabs[this.selectedTabIndex] = {
      ...tabs[this.selectedTabIndex],
      ...ev.detail.value
    };

    this.config = {
      ...this.config,
      tabs
    };

    this.notifyConfigChanged();
  }

  protected onTabCardChanged(ev: CustomEvent, index: number): void {
    ev.stopPropagation();
    ev.preventDefault();

    if (!this.config) return;

    const tabs = [...this.config.tabs];
    const tab = tabs[index] || this.newTabSkeleton;
    tabs[index] = { ...tab, card: ev.detail.config };

    this.selectedTabIndex = index;
    this.config = { ...this.config, tabs };
    this.notifyConfigChanged();
  }

  private onRemoveTab(index: number): void {
    const { tabs = [] } = this.config || { tabs: [] };
    if (tabs.length === 0) {
      return;
    }

    const updatedTabs = [...tabs];
    updatedTabs.splice(index, 1);

    this.config = { ...this.config!, tabs: updatedTabs };
    this.selectedTabIndex = -1;
    this.newTabSkeleton = { id: getUniqueId(), label: `Tab ${updatedTabs.length + 1}` };

    this.notifyConfigChanged();
  }

  private onGuiModeChanged(ev: CustomEvent): void {
    ev.stopPropagation();
    this.guiMode = ev.detail.guiMode;
    this.guiModeAvailable = ev.detail.guiModeAvailable;
  }

  private notifyConfigChanged(): void {
    this.dispatchEvent(new CustomEvent('config-changed', {
      detail: { config: this.config },
      bubbles: true,
      composed: true
    }));
  }

  static styles: CSSResultGroup = css`
  
  `;
}
