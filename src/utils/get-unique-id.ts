export const getUniqueId = () => {
  console.log('Creating new unique id');
  return window.crypto && crypto.randomUUID ? crypto.randomUUID() : 'tab-' + Date.now();
}
