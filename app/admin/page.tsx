'use client';

import { useState, useEffect } from 'react';

interface ImportResult {
  success: boolean;
  imported?: number;
  total?: number;
  sample?: string[];
  error?: string;
}

interface WordStats {
  total: number;
  byLength: Record<number, number>;
  sample: string[];
  error?: string;
}

export default function AdminPage() {
  const [count, setCount] = useState(100);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [stats, setStats] = useState<WordStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  const loadStats = async () => {
    setStatsLoading(true);
    try {
      const res = await fetch('/api/import-words');
      const data = await res.json();
      setStats(data);
    } catch {
      setStats({ total: 0, byLength: {}, sample: [], error: 'Falha ao carregar stats' });
    }
    setStatsLoading(false);
  };

  useEffect(() => {
    loadStats();
  }, []);

  const handleImport = async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch('/api/import-words', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count }),
      });
      const data = await res.json();
      setResult(data);
      if (data.success) loadStats();
    } catch {
      setResult({ success: false, error: 'Falha ao conectar com a API' });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#1a1a2e] text-white p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-[#fdcb6e]">
          🗃️ Admin - Importar Palavras
        </h1>

        <div className="bg-[#16213e] rounded-xl p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Status Atual</h2>
          {statsLoading ? (
            <p className="text-gray-400">Carregando...</p>
          ) : stats?.error ? (
            <p className="text-red-400">{stats.error}</p>
          ) : (
            <div>
              <p className="text-lg mb-2">
                Total de palavras EN: <span className="text-[#fdcb6e] font-bold">{stats?.total || 0}</span>
              </p>
              {stats?.byLength && Object.keys(stats.byLength).length > 0 && (
                <div className="mt-3">
                  <p className="text-sm text-gray-400 mb-1">Por tamanho:</p>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(stats.byLength)
                      .sort(([a], [b]) => Number(a) - Number(b))
                      .map(([len, qty]) => (
                        <span
                          key={len}
                          className="bg-[#0f3460] px-3 py-1 rounded-full text-sm"
                        >
                          {len} letras: <strong>{qty}</strong>
                        </span>
                      ))}
                  </div>
                </div>
              )}
              {stats?.sample && stats.sample.length > 0 && (
                <div className="mt-3">
                  <p className="text-sm text-gray-400 mb-1">Exemplo:</p>
                  <p className="text-[#2ecc71]">{stats.sample.join(', ')}</p>
                </div>
              )}
            </div>
          )}
          <button
            onClick={loadStats}
            className="mt-3 text-sm text-[#3498db] hover:underline"
          >
            🔄 Atualizar
          </button>
        </div>

        <div className="bg-[#16213e] rounded-xl p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Importar Palavras (API)</h2>
          <p className="text-gray-400 text-sm mb-4">
            Busca palavras aleatorias em ingles de uma API externa e salva no Supabase.
          </p>
          <div className="flex items-center gap-4 mb-4">
            <label className="text-sm text-gray-300">Quantidade:</label>
            <input
              type="number"
              min={1}
              max={500}
              value={count}
              onChange={e => setCount(Number(e.target.value))}
              className="bg-[#0f3460] border border-[#2a4a7f] rounded-lg px-4 py-2 w-24 text-white focus:outline-none focus:border-[#fdcb6e]"
            />
          </div>
          <button
            onClick={handleImport}
            disabled={loading}
            className="bg-[#2ecc71] hover:bg-[#27ae60] disabled:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg transition-colors w-full"
          >
            {loading ? '⏳ Importando...' : `📥 Importar ${count} Palavras`}
          </button>
        </div>

        {result && (
          <div
            className={`rounded-xl p-6 mb-6 ${
              result.success ? 'bg-[#1a3a2e] border border-[#2ecc71]' : 'bg-[#3a1a1a] border border-[#e74c3c]'
            }`}
          >
            {result.success ? (
              <div>
                <h3 className="text-[#2ecc71] font-bold text-lg mb-2">✅ Importacao Concluida</h3>
                <p>
                  Inseridas: <strong>{result.imported}</strong> de {result.total} buscadas
                </p>
                {result.sample && (
                  <p className="text-sm text-gray-400 mt-2">
                    Exemplo: {result.sample.join(', ')}
                  </p>
                )}
              </div>
            ) : (
              <div>
                <h3 className="text-[#e74c3c] font-bold text-lg mb-2">❌ Erro</h3>
                <p className="text-red-300">{result.error}</p>
              </div>
            )}
          </div>
        )}

        <div className="bg-[#16213e] rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4">📋 Schema da Tabela</h2>
          <pre className="bg-[#0f3460] rounded-lg p-4 text-sm overflow-x-auto text-[#2ecc71]">
{`CREATE TABLE words (
    id        INT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    word      VARCHAR(20) NOT NULL,
    length    TINYINT NOT NULL,
    language  CHAR(2) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_word_lookup
  ON words (language, length, is_active);`}
          </pre>
        </div>
      </div>
    </div>
  );
}
