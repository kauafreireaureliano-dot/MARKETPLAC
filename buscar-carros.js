const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const CONFIG = {
  regiao: 'Arcoverde',
  precoMaximo: 50000,
  anoMinimo: 2015,
  distanciaKm: 20,
};

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
  'vw voyage': 40000, 'hyundai ix35': 65000, 'jeep wrangler': 180000,
  'ford ranger': 110000, 'mitsubishi outlander': 80000,
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
  console.log(`   Raio: ${CONFIG.distanciaKm}km\n`);

  const perfilDir = path.join(__dirname, 'perfil-navegador');
  const browser = await chromium.launchPersistentContext(perfilDir, {
    headless: false,
    slowMo: 300,
    viewport: { width: 1280, height: 900 },
    locale: 'pt-BR',
  });

  try {
    const page = browser.pages()[0] || await browser.newPage();

    // Ir direto para a busca de veículos com localização
    const urlBusca = `https://www.facebook.com/marketplace/category/vehicles?sortBy=relevance&exact_only=false&radius=${CONFIG.distanciaKm}&location=${encodeURIComponent(CONFIG.regiao + ', Pernambuco')}`;
    console.log('📍 Abrindo Facebook Marketplace...');
    await page.goto(urlBusca, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(5000);

    // Esperar 60 segundos para o usuário fazer login manualmente
    console.log('\n⚠️  Você tem 60 segundos para:');
    console.log('   1. Fazer login no Facebook (se pedir)');
    console.log('   2. Navegar até ver os anúncios de carros');
    console.log('   O script continua automaticamente após 60s...\n');
    await page.waitForTimeout(60000);

    // Se ainda não está na página de veículos, navegar agora
    const urlAtual = page.url();
    if (!urlAtual.includes('/marketplace/category/vehicles')) {
      console.log('📍 Navegando para veículos no Marketplace...');
      await page.goto(urlBusca, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await page.waitForTimeout(5000);
    }

    console.log('⏳ Aguardando carregamento dos anúncios...');
    await page.waitForTimeout(3000);

    // Debug: salvar screenshot para ver o que está na tela
    const debugPath = path.join(__dirname, 'debug-marketplace.png');
    await page.screenshot({ path: debugPath, fullPage: false });
    console.log(`📸 Screenshot salvo em: ${debugPath}`);

    // Debug: salvar HTML da página
    const htmlPath = path.join(__dirname, 'debug-page.html');
    const htmlContent = await page.content();
    fs.writeFileSync(htmlPath, htmlContent, 'utf-8');
    console.log(`📄 HTML salvo em: ${htmlPath}`);

    console.log('🔍 Buscando veículos...\n');

    const carrosEncontrados = [];
    let scrollCount = 0;
    const maxScrolls = 10;

    while (scrollCount < maxScrolls) {
      // Estratégia 1: pegar todos os links do marketplace
      const links = await page.locator('a[href*="/marketplace/item/"]').all();

      // Estratégia 2: pegar todos os spans/divs com preço
      const precosEls = await page.locator('span:has-text("R$"), div:has-text("R$")').all();

      // Estratégia 3: analisar o HTML completo da página visível
      const pageText = await page.evaluate(() => document.body.innerText);

      // Extrair pares preço+título do texto da página
      // Padrão: "R$ XX.XXX" seguido ou precedido por texto do título
      const linhas = pageText.split('\n').map(l => l.trim()).filter(l => l.length > 0);

      for (let i = 0; i < linhas.length; i++) {
        const linha = linhas[i];

        // Procurar linhas com preço
        const precoMatch = linha.match(/R\$\s*([\d.,]+)/);
        if (precoMatch) {
          const precoStr = precoMatch[0];
          const precoNum = extrairPreco(precoStr);

          if (precoNum > 1000 && precoNum <= CONFIG.precoMaximo) {
            // Procurar título nas linhas próximas
            let titulo = '';

            // Verificar linhas antes e depois do preço
            for (let j = Math.max(0, i - 3); j <= Math.min(linhas.length - 1, i + 3); j++) {
              const candidata = linhas[j];
              if (candidata === linha) continue;
              if (candidata.match(/R\$/)) continue;
              if (candidata.length > 15 && candidata.length < 200 && !candidata.match(/^\d+$/)) {
                // Parece um título de carro
                const lower = candidata.toLowerCase();
                if (lower.match(/\d{4}|carro|auto|flex|sedan|hatch|suv|pickup|motor|ano|km|cilindradas|porta/) ||
                    lower.match(/honda|toyota|vw|volkswagen|chevrolet|fiat|ford|renault|nissan|jeep|hyundai|mitsubishi|peugeot|citroen|kia|bmw|mercedes|audi/)) {
                  titulo = candidata;
                  break;
                }
              }
            }

            // Se não achou título específico, usar a linha mais longa próxima
            if (!titulo) {
              for (let j = Math.max(0, i - 2); j <= Math.min(linhas.length - 1, i + 2); j++) {
                const candidata = linhas[j];
                if (candidata === linha) continue;
                if (candidata.match(/R\$/)) continue;
                if (candidata.length > 20 && candidata.length < 200) {
                  titulo = candidata;
                  break;
                }
              }
            }

            if (titulo && precoNum > 0) {
              const jaExiste = carrosEncontrados.some(c => c.preco === precoStr && c.titulo === titulo);
              if (!jaExiste) {
                // Tentar achar link correspondente
                let link = '#';
                for (const linkEl of links) {
                  try {
                    const href = await linkEl.getAttribute('href');
                    if (href && href.includes('/marketplace/item/')) {
                      link = href.startsWith('http') ? href : `https://www.facebook.com${href}`;
                      break;
                    }
                  } catch (_) {}
                }

                const valorFipe = obterValorFipe(titulo);
                const desconto = Math.round(((valorFipe - precoNum) / valorFipe) * 100);

                carrosEncontrados.push({
                  id: carrosEncontrados.length + 1,
                  titulo,
                  preco: precoStr,
                  ano: 0,
                  km: '',
                  localizacao: CONFIG.regiao + ' - PE',
                  link,
                  valorFipe: `R$ ${valorFipe.toLocaleString('pt-BR')}`,
                  descontoFipe: desconto > 0 ? `${desconto}% abaixo da Fipe` : 'Acima da Fipe',
                  dataBusca: new Date().toLocaleString('pt-BR'),
                });
              }
            }
          }
        }
      }

      console.log(`   Scroll ${scrollCount + 1}/${maxScrolls} — ${carrosEncontrados.length} carros encontrados até agora`);

      // Scroll mais agressivo
      await page.evaluate(() => {
        const scrollable = document.querySelector('[role="main"]') || document.scrollingElement || document.documentElement;
        scrollable.scrollTop += 1000;
        window.scrollBy(0, 1000);
      });
      await page.waitForTimeout(3000);
      scrollCount++;
    }

    // Filtrar abaixo da Fipe
    const abaixoFipe = carrosEncontrados.filter(c => {
      const precoNum = extrairPreco(c.preco);
      const fipeNum = extrairPreco(c.valorFipe || '0');
      return fipeNum > 0 && precoNum < fipeNum;
    });

    const resultado = {
      ultimaBusca: new Date().toLocaleString('pt-BR'),
      configuracao: CONFIG,
      carros: abaixoFipe.length > 0 ? abaixoFipe : carrosEncontrados,
    };

    const dataDir = path.join(__dirname, 'public', 'data');
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
    } else {
      console.log('⚠️  Nenhum carro encontrado. Verifique:');
      console.log('   - Se está logado no Facebook');
      console.log('   - Se o Marketplace carregou corretamente');
      console.log('   - O screenshot em debug-marketplace.png');
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