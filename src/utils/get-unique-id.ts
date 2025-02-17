export const getUniqueId = () => {
  return window.crypto && crypto.randomUUID ? crypto.randomUUID() : 'tab-' + Date.now();
}
