chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'CARROS_ATUALIZADOS') {
    chrome.storage.local.get(['historico'], (result) => {
      const historico = result.historico || [];
      const entrada = {
        timestamp: msg.timestamp,
        total: msg.carros.length,
        abaixoFipe: msg.carros.filter(c => c.abaixoFipe).length,
        carros: msg.carros,
      };
      historico.push(entrada);
      if (historico.length > 50) historico.splice(0, historico.length - 50);
      chrome.storage.local.set({ historico, ultimaBusca: entrada });
    });
  }
});

chrome.action.onClicked.addListener(() => {
  chrome.tabs.create({ url: 'https://www.facebook.com/marketplace/category/vehicles' });
});