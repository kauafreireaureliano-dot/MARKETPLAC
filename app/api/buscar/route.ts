import { NextRequest, NextResponse } from 'next/server';

const TABELA_FIPE: Record<string, number> = {
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
};

function obterValorFipe(titulo: string): number {
  const tituloLower = titulo.toLowerCase();
  for (const [modelo, valor] of Object.entries(TABELA_FIPE)) {
    if (tituloLower.includes(modelo)) return valor;
  }
  return 50000;
}

function extrairPrecoNumerico(precoStr: string): number {
  return parseFloat(precoStr.replace(/[^\d]/g, '')) || 0;
}

export async function POST(request: NextRequest) {
  try {
    const config = await request.json();

    if (!config.regiao || !config.precoMaximo) {
      return NextResponse.json(
        { success: false, error: 'Configurações inválidas' },
        { status: 400 }
      );
    }

    const todosVeiculos = [
      { id: 1, titulo: 'Honda Civic EXL 2.0 Flexone 16V Aut.', preco: 'R$ 45.900', ano: 2018, km: '65.000 km', localizacao: `${config.regiao} - PE`, link: '#' },
      { id: 2, titulo: 'Toyota Corolla XEi 2.0 Dual VVT-iE Aut.', preco: 'R$ 48.500', ano: 2019, km: '52.000 km', localizacao: `${config.regiao} - PE`, link: '#' },
      { id: 3, titulo: 'Hyundai HB20S Vision 1.6 Flex Aut.', preco: 'R$ 38.900', ano: 2017, km: '78.000 km', localizacao: `${config.regiao} - PE`, link: '#' },
      { id: 4, titulo: 'VW Gol 1.6 MSI Trendline', preco: 'R$ 32.000', ano: 2019, km: '45.000 km', localizacao: `${config.regiao} - PE`, link: '#' },
      { id: 5, titulo: 'Chevrolet Onix 1.4 LT', preco: 'R$ 35.500', ano: 2020, km: '38.000 km', localizacao: `${config.regiao} - PE`, link: '#' },
      { id: 6, titulo: 'Fiat Uno Vivace 1.0', preco: 'R$ 28.000', ano: 2018, km: '55.000 km', localizacao: `${config.regiao} - PE`, link: '#' },
      { id: 7, titulo: 'Ford Ka SE 1.5 Ti-VCT', preco: 'R$ 33.000', ano: 2019, km: '42.000 km', localizacao: `${config.regiao} - PE`, link: '#' },
      { id: 8, titulo: 'Renault Kwid Zen 1.0', preco: 'R$ 29.500', ano: 2020, km: '30.000 km', localizacao: `${config.regiao} - PE`, link: '#' },
      { id: 9, titulo: 'Nissan Versa Exclusive 1.6', preco: 'R$ 52.000', ano: 2018, km: '60.000 km', localizacao: `${config.regiao} - PE`, link: '#' },
      { id: 10, titulo: 'Jeep Renegade Longitude 1.8', preco: 'R$ 68.000', ano: 2019, km: '48.000 km', localizacao: `${config.regiao} - PE`, link: '#' },
    ];

    const veiculosAbaixoFipe = todosVeiculos.filter((veiculo) => {
      const precoAtual = extrairPrecoNumerico(veiculo.preco);
      const valorFipe = obterValorFipe(veiculo.titulo);
      const percentualFipe = (precoAtual / valorFipe) * 100;
      return precoAtual <= config.precoMaximo && percentualFipe < 100;
    }).map((veiculo) => {
      const precoAtual = extrairPrecoNumerico(veiculo.preco);
      const valorFipe = obterValorFipe(veiculo.titulo);
      const desconto = Math.round(((valorFipe - precoAtual) / valorFipe) * 100);
      return {
        ...veiculo,
        valorFipe: `R$ ${valorFipe.toLocaleString('pt-BR')}`,
        descontoFipe: `${desconto}% abaixo da Fipe`,
        dataBusca: new Date().toLocaleString('pt-BR'),
      };
    });

    return NextResponse.json({
      success: true,
      total: veiculosAbaixoFipe.length,
      anuncios: veiculosAbaixoFipe,
    });
  } catch (error) {
    console.error('Erro na busca:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao executar busca' },
      { status: 500 }
    );
  }
}