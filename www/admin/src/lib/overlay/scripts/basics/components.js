/// <reference types="overlay" />

class BasicChat extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  adoptedCallback() {
  }

  connectedCallback() {
    if (!this.shadowRoot) return;
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          background-color: red;
          width: 100%;
          height: 100%;
        }
      </style>
    `;
  }
}

class BasicMessage extends HTMLElement {}

window.customElements.define("basic-chat", BasicChat);
window.customElements.define("basic-message", BasicMessage);
