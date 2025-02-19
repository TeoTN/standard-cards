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
import { loadHuiCardPicker } from './utils/load-hui-card-picker';
import {
  mdiCodeBraces,
  mdiContentCopy,
  mdiContentCut,
  mdiDelete,
  mdiListBoxOutline,
  mdiPlus,
} from "@mdi/js";

@customElement(TABS_CARD_EDITOR_TAG_NAME)
export class StandardCardTabsEditor extends LitElement implements LovelaceCardEditor {
  @property({ attribute: false }) public hass?: HomeAssistant;
  @property({ attribute: false }) public lovelace?: LovelaceConfig;

  @state() private config?: TabsCardConfig;
  @state() private initialized = false;
  @state() private helpers?: LovelaceCardHelpers;
  @state() private selectedTabIndex = -1;
  @state() private guiMode = true;
  @state() private guiModeAvailable? = true;
  @state() private newTabSkeleton: Pick<Tab, 'id' | 'label'> = { id: getUniqueId(), label: `Tab 1` };

  @query("hui-card-element-editor") protected cardEditorEl?: any;

  public connectedCallback() {
    super.connectedCallback();
    if (this.initialized) {
      return;
    }

    this.initialize().then(() => {
      this.initialized = true;
    });
  }

  private async initialize() {
    const helpers = await getWindow().loadCardHelpers();
    this.helpers = helpers;
    await loadHuiCardPicker(helpers);
    this.initialized = true;
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

  protected render(): TemplateResult {
    if (!this.hass || !this.initialize) {
      return html``;
    }

    return html`
      <div class="standard-card-tabs-editor">
        ${this.toolbarTemplate()}
        <div class="editor">
          ${this.editorTemplate()}
        </div>
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
      console.warn("hui-card-picker is not defined")
    }

    return html`
      ${this.cardToolbarTemplate('New Tab')}
      <ha-form
        .hass=${this.hass}
        .data=${this.newTabSkeleton}
        .schema=${tabFormSchema}
        .computeLabel=${this.computeFormLabelCallback}
        @value-changed=${this.onTabFormValueChanged}
      ></ha-form>
      <div class="card-config">
        <hui-card-picker
          .hass=${this.hass}
          .lovelace=${this.lovelace}
          @config-changed=${e => this.onTabCardChanged(e, index)}
        ></hui-card-picker>
      </div>
    `;
  }

  protected editTabTemplate(tab: Tab): TemplateResult {
    return html`
      ${this.cardToolbarTemplate('Edit Tab')}
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
          .GUImode=${this.guiMode}
          @GUImode-changed=${this.onGuiModeChanged}
          @config-changed=${e => this.onTabCardChanged(e, this.selectedTabIndex)}
        ></hui-card-element-editor>
      </div>  
    `;
  }

  protected cardToolbarTemplate(title: string): TemplateResult {
    return html`
      <div class="card-toolbar">
        <h3>${title}</h3>
        <ha-icon-button
          class="gui-mode-button"
          @click=${this.onToggleMode}
          .disabled=${!this.guiModeAvailable}
          .label=${this.hass!.localize(
            this.guiMode
              ? "ui.panel.lovelace.editor.edit_card.show_code_editor"
              : "ui.panel.lovelace.editor.edit_card.show_visual_editor"
          )}
          .path=${this.guiMode ? mdiCodeBraces : mdiListBoxOutline}
        ></ha-icon-button>
        <div class="spacer"></div>
        <ha-icon-button
          class="remove-tab-button"
          @click=${this.onRemoveTab}
          .label=${this.hass!.localize(
            "ui.panel.lovelace.editor.edit_card.delete"
          )}
          .path=${mdiDelete}
        ></ha-icon-button>
      </div>
    `;
  }

  protected onToggleMode(): void {
    this.guiMode = !this.guiMode;
  }

  protected computeFormLabelCallback = (schema: { name: string }): string =>
    this.hass!.localize(`ui.panel.lovelace.editor.card.tabs.${schema.name}`);

  private onSelectedTabChanged(ev: CustomEvent): void {
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
    const isNewCard = index === tabs.length;
    const tab = tabs[index] || this.newTabSkeleton;
    tabs[index] = { ...tab, card: ev.detail.config };

    this.guiModeAvailable = ev.detail.guiModeAvailable;
    this.selectedTabIndex = index;
    this.config = { ...this.config, tabs };
    this.notifyConfigChanged();
  }

  private onRemoveTab(): void {
    const { tabs = [] } = this.config || { tabs: [] };
    if (tabs.length === 0) {
      return;
    }

    const updatedTabs = [...tabs];
    updatedTabs.splice(this.selectedTabIndex, 1);

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
    .standard-card-tabs-editor,
    .standard-card-tabs-editor .editor {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .card-toolbar {
      display: flex;
      flex-direction: row;
      align-items: center;
    }
    
    .card-toolbar .spacer {
      flex-grow: 1;
    }
    
    .card-toolbar :not(.spacer) {
      flex-grow: 0;
    }
  `;
}
