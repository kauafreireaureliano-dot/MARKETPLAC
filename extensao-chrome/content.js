// Cache da tabela Fipe por modelo+ano (evita requisições repetidas)
const cacheFipe = new Map();
const carrosColetados = new Map();
let overlayEl = null;
const MINIMO_ABAIXO_FIPE = 2000; // Mínimo R$ 2.000 abaixo da Fipe

// Códigos FIPE verificados na API parallelum.com.br/fipe/api/v1/carros/marcas
// Honda=25, Chevrolet=23, Fiat=21, Ford=22, Toyota=56, VW=59, Hyundai=26,
// Renault=48, Nissan=43, Jeep=29, Mitsubishi=41, Peugeot=44, Citroën=13,
// Kia=31, BMW=7, Mercedes=39, Audi=6
const MARCAS_CARROS = {
  'honda': { codigo: 25, modelos: {
    'civic': 1258, 'fit': 1274, 'city': 4971, 'hr-v': 7150, 'wr-v': 7899,
    'accord': 1241, 'cr-v': 1270, 'zr-v': 10894
  }},
  'toyota': { codigo: 56, modelos: {
    'corolla': 128, 'etios': 5689, 'hilux': 149, 'sw4': 268,
    'yaris': 8647, 'rav4': 205, 'bandeirante': 10
  }},
  'chevrolet': { codigo: 23, modelos: {
    'onix': 8988, 'prisma': 4867, 'cruze': 7619, 's10': 1133,
    'tracker': 7271, 'spin': 5693, 'cobalt': 5691, 'corsa': 55,
    'celta': 52, 'classic': 2656, 'astra': 8, 'vectra': 260,
    'zafira': 271, 'meriva': 174, 'montana': 182, 'agile': 4862,
    'blazer': 18
  }},
  'fiat': { codigo: 21, modelos: {
    'uno': 634, 'argo': 11401, 'strada': 248, 'mobi': 7760,
    'toro': 8046, 'palio': 196, 'punto': 3129, 'doblo': 82,
    'siena': 244, 'grand siena': 5694, 'idea': 151,
    'linea': 3130, 'bravo': 42, 'stilo': 247, '500': 7097,
    'cronos': 9988, 'pulse': 11509, 'fastback': 10754,
    'fiorino': 133, 'ducato': 83, 'titano': 10999
  }},
  'volkswagen': { codigo: 59, modelos: {
    'gol': 2381, 'polo': 2527, 'saveiro': 2553, 'fox': 5082,
    'voyage': 4752, 't-cross': 8642, 'up': 6715, 'virtus': 8184,
    'jetta': 4147, 'golf': 4006, 'tiguan': 4931, 'spacefox': 4007,
    'crossfox': 2368, 'amarok': 5261, 'nivus': 9150, 'taos': 9529,
    'bora': 38, 'passat': 198, 'touareg': 258
  }},
  'vw': { codigo: 59, modelos: {
    'gol': 2381, 'polo': 2527, 'saveiro': 2553, 'fox': 5082,
    'voyage': 4752, 't-cross': 8642, 'up': 6715, 'virtus': 8184,
    'jetta': 4147, 'golf': 4006, 'tiguan': 4931, 'spacefox': 4007,
    'crossfox': 2368, 'amarok': 5261, 'nivus': 9150, 'taos': 9529
  }},
  'hyundai': { codigo: 26, modelos: {
    'hb20': 6205, 'hb20s': 6434, 'hb20x': 6352, 'creta': 7829,
    'tucson': 1344, 'ix35': 5279, 'i30': 6356, 'elantra': 1300,
    'azera': 5726, 'santa fe': 1333, 'hr': 1328
  }},
  'ford': { codigo: 22, modelos: {
    'ka': 4514, 'ranger': 850, 'ecosport': 679, 'focus': 796,
    'fiesta': 770, 'edge': 5413, 'fusion': 6381, 'territory': 9163,
    'bronco': 11489, 'courier': 665, 'escort': 685, 'mondeo': 824,
    'cargo': 48, 'maverick': 9744
  }},
  'renault': { codigo: 48, modelos: {
    'kwid': 8021, 'sandero': 4504, 'duster': 5671, 'logan': 4387,
    'clio': 1994, 'megane': 2058, 'fluence': 5509, 'scenic': 2068,
    'symbol': 4868, 'master': 2048, 'kangoo': 2031,
    'captur': 7890, 'oroche': 7377, 'oroch': 7377, 'stepway': 8755,
    'kardian': 10990
  }},
  'nissan': { codigo: 43, modelos: {
    'versa': 7166, 'kicks': 7669, 'frontier': 1787, 'march': 7266,
    'sentra': 4294, 'livina': 3132, 'tiida': 4869, 'xterra': 272
  }},
  'jeep': { codigo: 29, modelos: {
    'renegade': 7272, 'compass': 7764, 'wrangler': 270,
    'commander': 9500, 'cherokee': 62, 'grand cherokee': 144
  }},
  'mitsubishi': { codigo: 41, modelos: {
    'l200': 165, 'outlander': 3133, 'asx': 4868, 'pajero': 195,
    'eclipse': 95, 'lancer': 166
  }},
  'peugeot': { codigo: 44, modelos: {
    '208': 5698, '2008': 6216, '308': 3134, '3008': 4869,
    'partner': 200, '206': 199, '207': 3128, '307': 3127,
    '408': 4870, 'hoggar': 4871, 'boxer': 39
  }},
  'citroen': { codigo: 13, modelos: {
    'c3': 55, 'c4': 69, 'aircross': 4870, 'ds3': 5700,
    'c5': 70, 'berlingo': 33, 'jumper': 155, 'xsara': 273
  }},
  'citroën': { codigo: 13, modelos: {
    'c3': 55, 'c4': 69, 'aircross': 4870, 'ds3': 5700
  }},
  'kia': { codigo: 31, modelos: {
    'sportage': 246, 'cerato': 63, 'soul': 3135, 'picanto': 4871,
    'mohave': 3136, 'sorento': 245, 'besta': 35, 'bongo': 37
  }},
  'bmw': { codigo: 7, modelos: {
    'serie 1': 3136, 'série 1': 3136, 'serie 3': 3137, 'série 3': 3137,
    'x1': 4872, 'x3': 4873, 'x5': 275, 'x6': 3138, 'z4': 277
  }},
  'mercedes': { codigo: 39, modelos: {
    'classe a': 4874, 'classe c': 4875, 'gla': 6217, 'glc': 7765,
    'classe e': 4876, 'gle': 7766, 'slk': 243, 'sprinter': 244
  }},
  'audi': { codigo: 6, modelos: {
    'a3': 1, 'a4': 2, 'q3': 5701, 'q5': 4876, 'a1': 4877,
    'a5': 3, 'a6': 4, 'q7': 4878, 'tt': 254
  }}
};

// Motos - códigos aproximados (API motos é /motos/ não /carros/)
const MARCAS_MOTOS = {
  'honda': { codigo: 21, modelos: {
    'pcx': 8701, 'cg 160': 8200, 'cg 150': 8100, 'cg 125': 8000,
    'biz': 8300, 'pop': 8400, 'bros': 8500, 'twister': 8600,
    'cb 300': 8050, 'cb 250': 8040, 'nc 750': 8800, 'xre 300': 8750,
    'hornet': 8900, 'lead': 8950, 'elite': 8960, 'adv 150': 8970,
    'fazer': 8600, 'cb 600': 8060, 'shadow': 8920, 'nx 400': 8780,
    'xr 250': 8770, 'crf 250': 8760, 'today': 8980
  }},
  'yamaha': { codigo: 60, modelos: {
    'fazer 250': 9100, 'factor': 9200, 'xtz 250': 9300, 'lander': 9400,
    'crosser': 9500, 'neo': 9600, 'fluo': 9700, 'nmax': 9800,
    'mt-03': 9150, 'r3': 9160, 'r15': 9170, 'tenere': 9350,
    'crypton': 9250, 'ybr': 9210, 'dragstar': 9900, 'v-star': 9910,
    'fazer': 9100, 'yzf': 9180, 'ttr': 9310
  }},
  'suzuki': { codigo: 55, modelos: {
    'burgman': 9500, 'intruder': 9600, 'yes': 9700, 'gsx': 9800,
    'dl 650': 9550, 'dr 350': 9450, 'address': 9750
  }},
  'dafra': { codigo: 14, modelos: {
    'super 100': 7100, 'speed': 7200, 'zig': 7300, 'apache': 7400,
    'horizon': 7500, 'next': 7600, 'citycom': 7700, 'roadwin': 7800
  }},
  'shineray': { codigo: 183, modelos: {
    'she': 16800, 'jet': 16810, 'worker': 16820, 'phoenix': 16830
  }}
};

function extrairInfoVeiculo(titulo) {
  const lower = titulo.toLowerCase();
  const anoMatch = titulo.match(/\b(19[9]\d|20[0-2]\d)\b/);
  const ano = anoMatch ? parseInt(anoMatch[1], 10) : null;

  const ehMoto = lower.match(/\bmot[oa]\b|\bcg\b|\bbiz\b|\bbros\b|\btwister\b|\bfazer\b|\bpcx\b|\bfactor\b|\blander\b|\bcrosser\b|\bneo\b|\bnmax\b|\bybr\b|\bburgman\b|\bintruder\b|\bhornet\b|\bpop\b|\blead\b|\belite\b|\bcrypton\b|\bxtz\b|\bxre\b|\bnc 750\b|\bshadow\b|\bcb \d/);
  const marcas = ehMoto ? MARCAS_MOTOS : MARCAS_CARROS;
  const tipo = ehMoto ? 'motos' : 'carros';

  for (const [marca, dados] of Object.entries(marcas)) {
    if (lower.includes(marca)) {
      for (const [modelo, codigo] of Object.entries(dados.modelos)) {
        if (lower.includes(modelo)) {
          return { marcaCodigo: dados.codigo, modeloCodigo: codigo, marca, modelo, ano, tipo };
        }
      }
      return { marcaCodigo: dados.codigo, modeloCodigo: null, marca, modelo: null, ano, tipo };
    }
  }
  return null;
}

async function buscarFipe(titulo) {
  const info = extrairInfoVeiculo(titulo);
  if (!info || !info.modeloCodigo) {
    console.log('[I9Car] Modelo não reconhecido:', titulo);
    return null;
  }

  const cacheKeyBase = `${info.tipo}-${info.marcaCodigo}-${info.modeloCodigo}`;

  try {
    const anosCacheKey = `${cacheKeyBase}-anos`;
    let anos;
    if (cacheFipe.has(anosCacheKey)) {
      anos = cacheFipe.get(anosCacheKey);
    } else {
      const urlAnos = `https://parallelum.com.br/fipe/api/v1/${info.tipo}/marcas/${info.marcaCodigo}/modelos/${info.modeloCodigo}/anos`;
      console.log('[I9Car] Buscando anos:', urlAnos);
      const response = await fetch(urlAnos);
      if (!response.ok) throw new Error(`API anos HTTP ${response.status}`);
      anos = await response.json();
      if (!anos || anos.length === 0) throw new Error('Sem anos disponíveis');
      cacheFipe.set(anosCacheKey, anos);
    }

    let anoTarget = null;
    if (info.ano) {
      anoTarget = anos.find(a => parseInt(a.codigo.split('-')[0], 10) === info.ano);
    }
    if (!anoTarget && info.ano) {
      const ordenados = [...anos].sort((a, b) =>
        parseInt(b.codigo.split('-')[0], 10) - parseInt(a.codigo.split('-')[0], 10)
      );
      anoTarget = ordenados.find(a => parseInt(a.codigo.split('-')[0], 10) <= info.ano)
        || ordenados[ordenados.length - 1];
    }
    if (!anoTarget) {
      const ordenados = [...anos].sort((a, b) =>
        parseInt(a.codigo.split('-')[0], 10) - parseInt(b.codigo.split('-')[0], 10)
      );
      anoTarget = ordenados[0];
    }

    const precoCacheKey = `${cacheKeyBase}-${anoTarget.codigo}`;
    if (cacheFipe.has(precoCacheKey)) return cacheFipe.get(precoCacheKey);

    const urlPreco = `https://parallelum.com.br/fipe/api/v1/${info.tipo}/marcas/${info.marcaCodigo}/modelos/${info.modeloCodigo}/anos/${anoTarget.codigo}`;
    console.log('[I9Car] Buscando preço:', urlPreco);
    const responsePreco = await fetch(urlPreco);
    if (!responsePreco.ok) throw new Error(`API preço HTTP ${responsePreco.status}`);
    const dadosPreco = await responsePreco.json();
    const valorStr = dadosPreco.Valor.replace(/[^\d,]/g, '').replace(',', '.');
    const valor = parseFloat(valorStr) || 0;

    if (valor > 0) {
      cacheFipe.set(precoCacheKey, valor);
      console.log('[I9Car] Fipe encontrada:', titulo, '=', valor);
      return valor;
    }
    return null;
  } catch (e) {
    console.error('[I9Car] Erro Fipe para', titulo, ':', e.message);
    return null;
  }
}

function extrairPreco(texto) {
  if (!texto) return 0;
  const nums = texto.replace(/[^\d]/g, '');
  return parseInt(nums, 10) || 0;
}

let toggleBtn = null;

function criarOverlay() {
  if (overlayEl) return overlayEl;
  overlayEl = document.createElement('div');
  overlayEl.id = 'i9car-overlay';
  overlayEl.innerHTML = `
    <div class="i9car-header">
      <span class="i9car-logo">🚗 I9Car</span>
      <span class="i9car-count">0 encontrados</span>
      <span class="i9car-abaixo">0 oportunidades</span>
      <button class="i9car-close" title="Minimizar">✕</button>
    </div>
    <div class="i9car-body">
      <div class="i9car-status">Escaneando anúncios...</div>
      <div class="i9car-lista"></div>
    </div>
  `;
  overlayEl.querySelector('.i9car-close').addEventListener('click', () => {
    overlayEl.style.display = 'none';
    mostrarToggleBtn();
  });
  document.body.appendChild(overlayEl);
  return overlayEl;
}

function mostrarToggleBtn() {
  if (toggleBtn) { toggleBtn.style.display = 'flex'; return; }
  toggleBtn = document.createElement('button');
  toggleBtn.id = 'i9car-toggle-btn';
  toggleBtn.innerHTML = '🚗';
  toggleBtn.title = 'Abrir painel I9Car';
  toggleBtn.addEventListener('click', () => {
    if (overlayEl) overlayEl.style.display = 'flex';
    toggleBtn.style.display = 'none';
  });
  document.body.appendChild(toggleBtn);
}

function atualizarOverlay() {
  if (!overlayEl) return;
  const todos = Array.from(carrosColetados.values());
  const oportunidades = todos.filter(c =>
    !c.buscandoFipe && c.valorFipe > 0 && (c.valorFipe - c.precoNum) >= MINIMO_ABAIXO_FIPE
  );

  overlayEl.querySelector('.i9car-count').textContent = `${todos.length} encontrados`;
  overlayEl.querySelector('.i9car-abaixo').textContent = `${oportunidades.length} oportunidades`;

  const lista = overlayEl.querySelector('.i9car-lista');
  const status = overlayEl.querySelector('.i9car-status');

  if (todos.length === 0) {
    status.textContent = 'Escaneando anúncios... role a página para carregar mais.';
    lista.innerHTML = '';
    return;
  }

  const buscandoFipe = todos.filter(c => c.buscandoFipe).length;
  status.textContent = buscandoFipe > 0
    ? `Buscando Fipe de ${buscandoFipe} veículos...`
    : `${oportunidades.length} de ${todos.length} com R$${MINIMO_ABAIXO_FIPE.toLocaleString('pt-BR')}+ abaixo da Fipe`;

  const ordenados = [...oportunidades].sort((a, b) =>
    (b.valorFipe - b.precoNum) - (a.valorFipe - a.precoNum)
  );
  const resto = todos.filter(c =>
    c.buscandoFipe || !c.valorFipe || (c.valorFipe - c.precoNum) < MINIMO_ABAIXO_FIPE
  );
  const todosOrdenados = [...ordenados, ...resto];

  lista.innerHTML = todosOrdenados.slice(0, 20).map(c => {
    const diferenca = c.valorFipe > 0 ? c.valorFipe - c.precoNum : 0;
    const desconto = c.valorFipe > 0 ? Math.round((diferenca / c.valorFipe) * 100) : 0;
    const ehOportunidade = !c.buscandoFipe && c.valorFipe > 0 && diferenca >= MINIMO_ABAIXO_FIPE;
    return `
      <div class="i9car-card ${ehOportunidade ? 'i9car-bom' : ''}">
        <div class="i9car-titulo">${c.titulo}</div>
        <div class="i9car-info">
          <span class="i9car-preco">${c.preco}</span>
          ${c.buscandoFipe
            ? '<span class="i9car-buscando">⏳ Fipe...</span>'
            : ehOportunidade
              ? `<span class="i9car-desconto">${desconto}% abaixo (R$${diferenca.toLocaleString('pt-BR')})</span>`
              : c.valorFipe > 0
                ? '<span class="i9car-acima">Margem insuficiente</span>'
                : '<span class="i9car-acima">Fipe não encontrada</span>'}
        </div>
        <div class="i9car-fipe">${c.buscandoFipe ? 'Buscando valor...' : c.valorFipe > 0 ? 'Fipe: R$ ' + c.valorFipe.toLocaleString('pt-BR') : 'Fipe indisponível'}</div>
        <a href="${c.link}" target="_blank" class="i9car-link">Ver anúncio →</a>
      </div>
    `;
  }).join('');

  chrome.runtime.sendMessage({
    type: 'CARROS_ATUALIZADOS',
    carros: todos,
    timestamp: new Date().toISOString(),
  });
}

async function processarNovoCarro(itemId, titulo, preco, precoNum, link) {
  if (carrosColetados.has(itemId)) return;

  carrosColetados.set(itemId, {
    id: itemId, titulo, preco, precoNum,
    valorFipe: 0, desconto: 0, abaixoFipe: false,
    buscandoFipe: true, link,
    dataColeta: new Date().toISOString(),
  });
  atualizarOverlay();

  const valorFipe = await buscarFipe(titulo);
  const carro = carrosColetados.get(itemId);
  if (carro) {
    carro.valorFipe = valorFipe || 0;
    carro.desconto = valorFipe > 0 ? Math.round(((valorFipe - precoNum) / valorFipe) * 100) : 0;
    carro.abaixoFipe = valorFipe > 0 && (valorFipe - precoNum) >= MINIMO_ABAIXO_FIPE;
    carro.buscandoFipe = false;
    atualizarOverlay();
  }
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
        } else if (linha.length > 5 && linha.length < 200 && !linha.match(/R\$/) && !titulo) {
          const lower = linha.toLowerCase();
          if (lower.match(/\d{4}|honda|toyota|vw|volkswagen|chevrolet|fiat|ford|renault|nissan|jeep|hyundai|mitsubishi|peugeot|citro|kia|bmw|mercedes|audi|suzuki|yamaha|dafra|shineray|civic|corolla|onix|gol|hb20|uno|ka|kwid|versa|renegade|fit|etios|polo|prisma|argo|creta|compass|hr-v|hilux|s10|strada|saveiro|duster|kicks|city|yaris|tracker|toro|t-cross|tucson|l200|accord|sw4|spin|mobi|fox|sandero|frontier|wr-v|rav4|cruze|punto|voyage|ix35|ranger|outlander|cobalt|palio|up|logan|march|pcx|fazer|factor|biz|bros|twister|cg 160|cg 150|cg 125|pop|lander|crosser|neo|nmax|ybr|burgman|intruder|hornet|oggi|astra|vectra|celta|classic|zafira|meriva|montana|spacefox|crossfox|amarok|nivus|taos|virtus|jetta|golf|tiguan|passat|captur|arkana|sentra|livina|tiida|commander|cherokee|asx|pajero|eclipse|lancer|208|2008|308|3008|partner|206|207|307|408|hoggar|c3|c4|aircross|c5|berlingo|jumper|xsara|sportage|cerato|soul|picanto|mohave|sorento|besta|bongo|serie|série|classe|gla|glc|gle|slk|sprinter|a3|a4|q3|q5|a1|a5|a6|q7|tt|cronos|pulse|fastback|fiorino|ducato|idea|linea|bravo|stilo|500|ecosport|focus|fiesta|edge|fusion|territory|bronco|courier|escort|mondeo|cargo|clio|megane|fluence|scenic|symbol|master|kangoo|joy|blazer|corsa|agile|hb20s|hb20x|azera|santa fe|hr/i)) {
            titulo = linha;
          }
        }
      }
      if (!titulo || !preco) continue;
      const precoNum = extrairPreco(preco);
      if (precoNum < 500 || precoNum > 500000) continue;
      const href = link.href;
      const itemId = href.match(/item\/(\d+)/)?.[1] || href;
      if (carrosColetados.has(itemId)) continue;
      processarNovoCarro(itemId, titulo, preco, precoNum, href);
    } catch (_) {}
  }
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
    cacheFipe.clear();
    atualizarOverlay();
  }
  if (msg.type === 'TOGGLE_OVERLAY') {
    if (overlayEl) {
      overlayEl.style.display = overlayEl.style.display === 'none' ? 'block' : 'none';
    }
  }
});