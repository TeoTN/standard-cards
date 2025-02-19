import { css, html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('std-ui-tab')
export class StdUiTab extends LitElement {
  @property({ type: Boolean, reflect: true }) active = false;

  static styles = css`
    :host {
      position: relative;
      display: flex;
      padding: 0 1rem;
      align-items: center;
      justify-content: center;
      height: 3rem;
      border-radius: 1.5rem;
      width: auto; /* Change width to auto */
      text-wrap: nowrap;
      font-size: 1rem;
      font-weight: 500;
      line-height: 1.25;
      color: var(--primary-text-color);
      cursor: pointer;
      user-select: none;
      box-sizing: border-box;
      margin: 0 0.25rem;
    }

    :host(:hover) {
      color: var(--primary-color);
    }

    :host([active]) {
      color: white;
    }
  `;

  render() {
    return html`<slot></slot>`;
  }
}