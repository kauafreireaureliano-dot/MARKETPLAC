const TABELA_FIPE = {
  'honda civic': 65000, 'toyota corolla': 70000, 'hyundai hb20': 55000,
  'vw gol': 40000, 'chevrolet onix': 50000, 'fiat uno': 35000,
  'ford ka': 42000, 'renault kwid': 38000, 'nissan versa': 60000,
  'jeep renegade': 80000, 'honda fit': 50000, 'toyota etios': 45000,
  'vw polo': 55000, 'chevrolet prisma': 48000, 'fiat argo': 52000,
  'hyundai creta': 75000, 'jeep compass': 95000, 'honda hr-v': 85000,
  'toyota hilux': 120000, 'chevrolet s10': 110000, 'fiat strada': 65000,
  'vw saveiro': 55000, 'renault duster': 60000, 'nissan kicks': 70000,
  'honda city': 55000, 'toyota yaris': 60000, 'chevrolet tracker': 80000,
  'fiat toro': 90000, 'vw t-cross': 85000, 'hyundai tucson': 70000,
  'mitsubishi l200': 100000, 'honda accord': 75000, 'toyota sw4': 150000,
  'chevrolet spin': 55000, 'fiat mobi': 40000, 'vw fox': 35000,
  'renault sandero': 45000, 'nissan frontier': 100000, 'honda wr-v': 70000,
  'toyota rav4': 120000, 'chevrolet cruze': 65000, 'fiat punto': 35000,
  'vw voyage': 40000, 'hyundai ix35': 65000, 'ford ranger': 110000,
  'mitsubishi outlander': 80000, 'chevrolet cobalt': 45000,
  'fiat palio': 30000, 'vw up': 35000, 'renault logan': 42000,
  'nissan march': 35000, 'honda brio': 30000, 'toyota campo': 50000,
};

function obterValorFipe(titulo) {
  const lower = titulo.toLowerCase();
  for (const [modelo, valor] of Object.entries(TABELA_FIPE)) {
    if (lower.includes(modelo)) return valor;
  }
  return 50000;
}

function extrairPreco(texto) {
  if (!texto) return 0;
  const nums = texto.replace(/[^\d]/g, '');
  return parseInt(nums, 10) || 0;
}

const carrosColetados = new Map();
let overlayEl = null;

function criarOverlay() {
  if (overlayEl) return overlayEl;
  overlayEl = document.createElement('div');
  overlayEl.id = 'i9car-overlay';
  overlayEl.innerHTML = `
    <div class="i9car-header">
      <span class="i9car-logo"> I9Car</span>
      <span class="i9car-count">0 encontrados</span>
      <span class="i9car-abaixo">0 abaixo da Fipe</span>
    </div>
    <div class="i9car-body">
      <div class="i9car-status">Escaneando anúncios...</div>
      <div class="i9car-lista"></div>
    </div>
  `;
  document.body.appendChild(overlayEl);
  return overlayEl;
}

function atualizarOverlay() {
  if (!overlayEl) return;
  const todos = Array.from(carrosColetados.values());
  const abaixoFipe = todos.filter(c => c.abaixoFipe);

  overlayEl.querySelector('.i9car-count').textContent = `${todos.length} encontrados`;
  overlayEl.querySelector('.i9car-abaixo').textContent = `${abaixoFipe.length} abaixo da Fipe`;

  const lista = overlayEl.querySelector('.i9car-lista');
  const status = overlayEl.querySelector('.i9car-status');

  if (todos.length === 0) {
    status.textContent = 'Escaneando anúncios... role a página para carregar mais.';
    lista.innerHTML = '';
    return;
  }

  status.textContent = `${abaixoFipe.length} de ${todos.length} estão abaixo da Fipe`;

  const ordenados = [...abaixoFipe].sort((a, b) => b.desconto - a.desconto);
  lista.innerHTML = ordenados.slice(0, 20).map(c => `
    <div class="i9car-card ${c.abaixoFipe ? 'i9car-bom' : ''}">
      <div class="i9car-titulo">${c.titulo}</div>
      <div class="i9car-info">
        <span class="i9car-preco">${c.preco}</span>
        ${c.abaixoFipe ? `<span class="i9car-desconto">${c.desconto}% abaixo</span>` : '<span class="i9car-acima">Acima da Fipe</span>'}
      </div>
      <div class="i9car-fipe">Fipe: R$ ${c.valorFipe.toLocaleString('pt-BR')}</div>
      <a href="${c.link}" target="_blank" class="i9car-link">Ver anúncio →</a>
    </div>
  `).join('');

  chrome.runtime.sendMessage({
    type: 'CARROS_ATUALIZADOS',
    carros: todos,
    timestamp: new Date().toISOString(),
  });
}

function escanearPagina() {
  const links = document.querySelectorAll('a[href*="/marketplace/item/"]');

  for (const link of links) {
    try {
      const card = link.closest('[role="listitem"]') || link.closest('div[dir="auto"]')?.parentElement || link.parentElement;
      if (!card) continue;

      const texto = card.innerText || '';
      const linhas = texto.split('\n').map(l => l.trim()).filter(Boolean);

      let preco = '';
      let titulo = '';

      for (const linha of linhas) {
        const precoMatch = linha.match(/R\$\s*([\d.,]+)/);
        if (precoMatch && !preco) {
          preco = precoMatch[0];
        } else if (linha.length > 10 && linha.length < 200 && !linha.match(/R\$/) && !titulo) {
          const lower = linha.toLowerCase();
          if (lower.match(/\d{4}|honda|toyota|vw|volkswagen|chevrolet|fiat|ford|renault|nissan|jeep|hyundai|mitsubishi|peugeot|citroen|kia|bmw|mercedes|audi|civic|corolla|onix|gol|hb20|uno|ka|kwid|versa|renegade|fit|etios|polo|prisma|argo|creta|compass|hr-v|hilux|s10|strada|saveiro|duster|kicks|city|yaris|tracker|toro|t-cross|tucson|l200|accord|sw4|spin|mobi|fox|sandero|frontier|wr-v|rav4|cruze|punto|voyage|ix35|ranger|outlander|cobalt|palio|up|logan|march/)) {
            titulo = linha;
          }
        }
      }

      if (!titulo || !preco) continue;

      const precoNum = extrairPreco(preco);
      if (precoNum < 1000 || precoNum > 500000) continue;

      const href = link.href;
      const itemId = href.match(/item\/(\d+)/)?.[1] || href;

      if (carrosColetados.has(itemId)) continue;

      const valorFipe = obterValorFipe(titulo);
      const desconto = Math.round(((valorFipe - precoNum) / valorFipe) * 100);
      const abaixoFipe = precoNum < valorFipe;

      carrosColetados.set(itemId, {
        id: itemId,
        titulo,
        preco,
        precoNum,
        valorFipe,
        desconto,
        abaixoFipe,
        link: href,
        dataColeta: new Date().toISOString(),
      });
    } catch (_) {}
  }

  atualizarOverlay();
}

let scanInterval = null;
function iniciarScan() {
  criarOverlay();
  escanearPagina();
  scanInterval = setInterval(escanearPagina, 2000);
}

if (window.location.href.includes('/marketplace/')) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(iniciarScan, 3000));
  } else {
    setTimeout(iniciarScan, 3000);
  }
}

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === 'LIMPAR_DADOS') {
    carrosColetados.clear();
    atualizarOverlay();
  }
  if (msg.type === 'TOGGLE_OVERLAY') {
    if (overlayEl) {
      overlayEl.style.display = overlayEl.style.display === 'none' ? 'block' : 'none';
    }
  }
});