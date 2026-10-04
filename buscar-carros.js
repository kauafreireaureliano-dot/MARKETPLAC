const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const CONFIG = {
  regiao: 'Arcoverde',
  precoMaximo: 50000,
  anoMinimo: 2015,
  distanciaKm: 100,
};

const TABELA_FIPE = {
  'honda civic': 65000,
  'toyota corolla': 70000,
  'hyundai hb20': 55000,
  'vw gol': 40000,
  'chevrolet onix': 50000,
  'fiat uno': 35000,
  'ford ka': 42000,
  'renault kwid': 38000,
  'nissan versa': 60000,
  'jeep renegade': 80000,
  'honda fit': 50000,
  'toyota etios': 45000,
  'vw polo': 55000,
  'chevrolet prisma': 48000,
  'fiat argo': 52000,
  'hyundai creta': 75000,
  'jeep compass': 95000,
  'honda hr-v': 85000,
  'toyota hilux': 120000,
  'chevrolet s10': 110000,
  'fiat stranda': 65000,
  'fiat strada': 65000,
  'vw saveiro': 55000,
  'renault duster': 60000,
  'nissan kicks': 70000,
  'honda city': 55000,
  'toyota yaris': 60000,
  'chevrolet tracker': 80000,
  'fiat toro': 90000,
  'vw t-cross': 85000,
  'hyundai tucson': 70000,
  'mitsubishi l200': 100000,
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

async function buscar() {
  console.log('🚗 Iniciando busca de carros no Marketplace...\n');
  console.log(`   Região: ${CONFIG.regiao}`);
  console.log(`   Preço máximo: R$ ${CONFIG.precoMaximo.toLocaleString('pt-BR')}`);
  console.log(`   Ano mínimo: ${CONFIG.anoMinimo}\n`);

  const perfilDir = path.join(__dirname, 'perfil-navegador');
  const browser = await chromium.launchPersistentContext(perfilDir, {
    headless: false,
    slowMo: 500,
    viewport: { width: 1280, height: 800 },
    locale: 'pt-BR',
  });

  try {
    const page = browser.pages()[0] || await browser.newPage();

    console.log('📍 Abrindo Facebook Marketplace...');
    await page.goto('https://www.facebook.com/marketplace/category/vehicles', {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    });

    await page.waitForTimeout(3000);

    const precisaLogin = await page.locator('input[type="email"], input[name="email"]').isVisible().catch(() => false);
    if (precisaLogin) {
      console.log('\n⚠️  Faça login no Facebook na janela do Chrome.');
      console.log('   Depois que carregar o Marketplace, pressione ENTER aqui...\n');
      await new Promise((resolve) => process.stdin.once('data', resolve));
      await page.waitForTimeout(3000);
    }

    console.log('🔍 Buscando veículos...\n');

    const carrosEncontrados = [];
    let scrollCount = 0;
    const maxScrolls = 8;

    while (scrollCount < maxScrolls) {
      const cards = await page.locator('[data-testid="marketplace-search-item"]').all().catch(() => []);
      const altCards = cards.length === 0
        ? await page.locator('div[dir="auto"] > a[href*="/marketplace/item/"]').all().catch(() => [])
        : [];

      const allCards = cards.length > 0 ? cards : altCards;

      for (const card of allCards) {
        try {
          const texto = await card.textContent().catch(() => '');
          if (!texto || texto.length < 10) continue;

          const linhas = texto.split('\n').map((l) => l.trim()).filter(Boolean);

          let titulo = '';
          let preco = '';
          let link = '';

          for (const linha of linhas) {
            if (linha.match(/R\$\s*[\d.,]+/)) {
              preco = linha.match(/R\$\s*[\d.,]+/)[0];
            } else if (linha.length > 10 && !titulo) {
              titulo = linha;
            }
          }

          const href = await card.getAttribute('href').catch(() => null);
          if (href) {
            link = href.startsWith('http') ? href : `https://www.facebook.com${href}`;
          } else {
            const linkEl = await card.locator('a[href*="/marketplace/item/"]').first().getAttribute('href').catch(() => null);
            if (linkEl) {
              link = linkEl.startsWith('http') ? linkEl : `https://www.facebook.com${linkEl}`;
            }
          }

          if (titulo && preco) {
            const precoNum = extrairPreco(preco);
            if (precoNum > 0 && precoNum <= CONFIG.precoMaximo) {
              const jaExiste = carrosEncontrados.some((c) => c.titulo === titulo && c.preco === preco);
              if (!jaExiste) {
                const valorFipe = obterValorFipe(titulo);
                const desconto = Math.round(((valorFipe - precoNum) / valorFipe) * 100);

                carrosEncontrados.push({
                  id: carrosEncontrados.length + 1,
                  titulo,
                  preco,
                  ano: 0,
                  km: '',
                  localizacao: CONFIG.regiao,
                  link: link || '#',
                  valorFipe: `R$ ${valorFipe.toLocaleString('pt-BR')}`,
                  descontoFipe: desconto > 0 ? `${desconto}% abaixo da Fipe` : 'Acima da Fipe',
                  dataBusca: new Date().toLocaleString('pt-BR'),
                });
              }
            }
          }
        } catch (_) {}
      }

      console.log(`   Scroll ${scrollCount + 1}/${maxScrolls} — ${carrosEncontrados.length} carros encontrados até agora`);

      await page.evaluate(() => window.scrollBy(0, 800));
      await page.waitForTimeout(2000);
      scrollCount++;
    }

    const abaixoFipe = carrosEncontrados.filter((c) => {
      const precoNum = extrairPreco(c.preco);
      const fipeNum = extrairPreco(c.valorFipe || '0');
      return fipeNum > 0 && precoNum < fipeNum;
    });

    const resultado = {
      ultimaBusca: new Date().toLocaleString('pt-BR'),
      configuracao: CONFIG,
      carros: abaixoFipe.length > 0 ? abaixoFipe : carrosEncontrados,
    };

    const dataDir = path.join(__dirname, 'data');
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

    const outputPath = path.join(dataDir, 'carros.json');
    fs.writeFileSync(outputPath, JSON.stringify(resultado, null, 2), 'utf-8');

    console.log(`\n✅ Busca concluída!`);
    console.log(`   Total encontrado: ${carrosEncontrados.length}`);
    console.log(`   Abaixo da Fipe: ${abaixoFipe.length}`);
    console.log(`   Salvos em: ${outputPath}\n`);

    if (resultado.carros.length > 0) {
      console.log('🏆 Melhores oportunidades:\n');
      resultado.carros.slice(0, 5).forEach((c, i) => {
        console.log(`   ${i + 1}. ${c.titulo}`);
        console.log(`      ${c.preco} | ${c.descontoFipe}`);
        console.log(`      ${c.link}\n`);
      });
    }

    console.log('🔄 Atualize a página do painel para ver os resultados!');
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await browser.close();
    console.log('\n👋 Navegador fechado.');
  }
}

buscar();