// Use the globally registered element (assuming it’s loaded independently)
const Ripple = customElements.get('mwc-ripple') ?? class { };

export default Ripple;
