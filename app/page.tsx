import carrosData from '../public/data/carros.json';

interface Carro {
  id: number;
  titulo: string;
  preco: string;
  ano: number;
  km: string;
  localizacao: string;
  link: string;
  valorFipe?: string;
  descontoFipe?: string;
  dataBusca: string;
}

interface DadosBusca {
  ultimaBusca: string | null;
  configuracao: Record<string, unknown>;
  carros: Carro[];
}

export default function Home() {
  const dados = carrosData as DadosBusca;
  const carros = dados.carros || [];

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-6xl mx-auto px-4 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-orange-400">I9Car - Busca de Veículos</h1>
            <p className="text-gray-400 text-sm">Oportunidades abaixo da Tabela Fipe</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500">Última busca</p>
            <p className="text-sm font-semibold text-gray-300">{dados.ultimaBusca || 'Nenhuma ainda'}</p>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-6 bg-gray-800 rounded-lg p-4 border border-gray-700">
          <p className="text-gray-300 text-sm">
            Para buscar carros novos, rode no terminal: <code className="bg-gray-700 px-2 py-1 rounded text-orange-400">node buscar-carros.js</code>
          </p>
          <p className="text-gray-500 text-xs mt-1">
            O script vai abrir o Chrome, buscar no Marketplace e atualizar esta página automaticamente.
          </p>
        </div>

        {carros.length === 0 ? (
          <div className="bg-gray-800 rounded-lg p-12 text-center border border-gray-700">
            <div className="text-6xl mb-4">🚗</div>
            <h3 className="text-lg font-medium text-gray-300 mb-2">Nenhum veículo encontrado ainda</h3>
            <p className="text-gray-500">Rode o script de busca para encontrar oportunidades</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-200">
                Veículos Encontrados ({carros.length})
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {carros.map((carro) => (
                <div key={carro.id} className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700 hover:border-orange-500 transition-colors">
                  <div className="h-40 bg-gray-700 flex items-center justify-center">
                    <span className="text-gray-500 text-4xl">🚙</span>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-200 mb-2 line-clamp-2 text-sm">
                      {carro.titulo}
                    </h3>
                    <div className="space-y-1.5 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Preço:</span>
                        <span className="font-bold text-green-400 text-base">{carro.preco}</span>
                      </div>
                      {carro.valorFipe && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">Fipe:</span>
                          <span className="text-gray-400">{carro.valorFipe}</span>
                        </div>
                      )}
                      {carro.descontoFipe && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">Economia:</span>
                          <span className="font-bold text-orange-400">{carro.descontoFipe}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-gray-500">Ano:</span>
                        <span className="text-gray-300">{carro.ano || '-'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">KM:</span>
                        <span className="text-gray-300">{carro.km || '-'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Local:</span>
                        <span className="text-gray-300">{carro.localizacao}</span>
                      </div>
                    </div>
                    {carro.link && carro.link !== '#' && (
                      <a
                        href={carro.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-4 block w-full text-center bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2 px-4 rounded transition-colors text-sm"
                      >
                        Ver no Marketplace →
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}