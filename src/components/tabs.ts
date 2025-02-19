import { css, html, LitElement } from 'lit';
import { customElement, property, query, queryAll, queryAssignedElements } from 'lit/decorators.js';
import { StdUiTab } from './tab';
import { is } from 'superstruct';

@customElement('std-ui-tabs')
export class StdUiTabs extends LitElement {
  @query('slot') private readonly slotElement!: HTMLSlotElement | null;

  @queryAssignedElements({ selector: 'std-ui-tab' })
  private tabs!: ReadonlyArray<StdUiTab>;

  @property({type: Number, attribute: 'active-index'})
  get activeIndex() {
    return this.tabs.findIndex((tab) => tab.active);
  }
  set activeIndex(index: number) {
    console.log('set activeIndex', index);
    const activate = () => {
      const tab = this.tabs[index];
      // Ignore out-of-bound indices.
      if (tab) {
        this.activateTab(tab);
      }
    };

    if (!this.slotElement) {
      this.updateComplete.then(activate);
      return;
    }

    activate();
  }

  get activeTab() {
    return this.tabs.find((tab) => tab.active) ?? null;
  }
  set activeTab(tab: StdUiTab | null) {
    if (tab) {
      this.activateTab(tab);
    }
  }

  private activateTab(activeTab: StdUiTab) {
    console.log('activateTab', activeTab);
    const { tabs } = this;
    const previousTab = this.activeTab;
    if (!tabs.includes(activeTab) || previousTab === activeTab) {
      return;
    }

    let activeIndex;
    tabs.forEach((tab, i) => {
      const isActive = tab === activeTab;
      tab.active = isActive;
      if (isActive) {
        activeIndex = i;
      }
    });

    if (previousTab) {
      // Don't dispatch a change event if activating a tab when no previous tabs
      // were selected, such as when md-tabs auto-selects the first tab.
      this.dispatchEvent(new CustomEvent('selected', {
        detail: { index: activeIndex },
        bubbles: true,
        composed: true,
      }));
    }

    this.updateIndicator(activeTab);
  }

  static styles = css`
    :host {
      display: block;
      border-radius: 1.5rem;
      max-width: 100%;
      width: fit-content;
      height: 3rem;
      margin: 0 auto 1rem auto;
      border: 1px solid var(--divider-color, rgba(0, 0, 0, 0.12));
      position: relative;
    }

    .tabs {
      display: flex;
      justify-content: flex-start; /* Changed from center to flex-start */
      overflow-x: auto;
      scrollbar-width: none;
      position: relative;
      z-index: 1;
      gap: 0.5rem;
      max-width: 100%;
    }

    .tabs::-webkit-scrollbar {
      display: none;
    }

    .indicator {
      position: absolute;
      height: calc(100% - 0.5rem);
      top: 0.25rem;
      left: 0;
      background: var(--primary-color, #03a9f4);
      border-radius: 1.25rem;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      z-index: 0;
      opacity: 0.75;
      margin: 0 0.25rem;
    }
  `;

  connectedCallback() {
    super.connectedCallback();
    // Set initial active state after connection
    requestAnimationFrame(() => {
      if (this.tabs.length > 0) {
        this.tabs[0].setAttribute('active', '');
      }
    });
  }

  render() {
    return html`
      <div class="tabs">
        <div class="indicator"></div>
        <slot @click=${this.onTabClick}></slot>
      </div>
    `;
  }

  private onTabClick(e: Event) {
    const target = e.target as HTMLElement;
    const tab = target.closest<StdUiTab>('std-ui-tab');
    if (!tab) return;
    this.activateTab(tab);

    this.updateIndicator(tab);
  }

  private updateIndicator(tab: StdUiTab) {
    requestAnimationFrame(() => {
      const indicator = this.renderRoot.querySelector('.indicator') as HTMLElement;
      if (!indicator) return;

      indicator.style.width = `${tab.offsetWidth}px`;
      indicator.style.left = `calc(${tab.offsetLeft}px - 0.25rem)`;
    });
  }
}