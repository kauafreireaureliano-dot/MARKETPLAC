document.getElementById('btnMarketplace').addEventListener('click', () => {
  chrome.tabs.create({ url: 'https://www.facebook.com/marketplace/category/vehicles' });
});

document.getElementById('btnLimpar').addEventListener('click', () => {
  chrome.storage.local.set({ historico: [], ultimaBusca: null });
  chrome.tabs.query({ url: 'https://www.facebook.com/marketplace/*' }, (tabs) => {
    tabs.forEach(tab => chrome.tabs.sendMessage(tab.id, { type: 'LIMPAR_DADOS' }));
  });
  carregarDados();
});

function carregarDados() {
  chrome.storage.local.get(['ultimaBusca'], (result) => {
    const busca = result.ultimaBusca;
    if (!busca || !busca.carros || busca.carros.length === 0) {
      document.getElementById('total').textContent = '0';
      document.getElementById('abaixo').textContent = '0';
      document.getElementById('lista').innerHTML = `
        <div class="vazio">
          <div class="emoji">🔍</div>
          <p>Abra o Facebook Marketplace e role a página.<br>A extensão coleta os carros automaticamente.</p>
        </div>`;
      return;
    }

    const carros = busca.carros;
    const abaixoFipe = carros.filter(c => c.abaixoFipe);
    document.getElementById('total').textContent = carros.length;
    document.getElementById('abaixo').textContent = abaixoFipe.length;

    const ordenados = [...abaixoFipe].sort((a, b) => b.desconto - a.desconto);
    const resto = carros.filter(c => !c.abaixoFipe);
    const todos = [...ordenados, ...resto];

    document.getElementById('lista').innerHTML = todos.slice(0, 30).map(c => `
      <div class="card ${c.abaixoFipe ? 'bom' : ''}">
        <div class="titulo">${c.titulo}</div>
        <div class="info">
          <span class="preco">${c.preco}</span>
          ${c.abaixoFipe
            ? `<span class="desconto">${c.desconto}% abaixo</span>`
            : '<span class="acima">Acima da Fipe</span>'}
        </div>
        <div class="fipe">Fipe: R$ ${c.valorFipe.toLocaleString('pt-BR')}</div>
        <a href="${c.link}" target="_blank">Ver anúncio →</a>
      </div>
    `).join('');
  });
}

carregarDados();