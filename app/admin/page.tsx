'use client';

import { useState, useEffect, useCallback } from 'react';

interface ImportResult {
  success: boolean;
  imported?: number;
  total?: number;
  sample?: string[];
  error?: string;
}

interface WordStats {
  total: number;
  byLevel: Record<string, number>;
  byLength?: Record<string, number>;
  sample: string[];
  error?: string;
}

const ADMIN_TOKEN_KEY = 'crossclues_admin_token';

export default function AdminPage() {
  const [token, setToken] = useState('');
  const [tokenSaved, setTokenSaved] = useState(false);
  const [count, setCount] = useState(100);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [stats, setStats] = useState<WordStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  // Load saved token from localStorage on mount
  useEffect(() => {
    const savedToken = localStorage.getItem(ADMIN_TOKEN_KEY);
    if (savedToken) {
      setToken(savedToken);
      setTokenSaved(true);
    }
  }, []);

  const saveToken = () => {
    if (token.trim()) {
      localStorage.setItem(ADMIN_TOKEN_KEY, token.trim());
      setTokenSaved(true);
    }
  };

  const clearToken = () => {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    setToken('');
    setTokenSaved(false);
  };

  const getAuthHeaders = useCallback((): Record<string, string> => {
    const headers: Record<string, string> = {};
    if (token.trim()) {
      headers['Authorization'] = `Bearer ${token.trim()}`;
    }
    return headers;
  }, [token]);

  const loadStats = async () => {
    setStatsLoading(true);
    try {
      const res = await fetch('/api/import-words', {
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      setStats(data);
    } catch {
      setStats({ total: 0, byLevel: {}, byLength: {}, sample: [], error: 'Failed to load stats' });
    }
    setStatsLoading(false);
  };

  useEffect(() => {
    if (tokenSaved || token) {
      loadStats();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokenSaved]);

  const handleImport = async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch('/api/import-words', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ count }),
      });
      const data = await res.json();
      setResult(data);
      if (data.success) loadStats();
    } catch {
      setResult({ success: false, error: 'Failed to connect to API' });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#1a1a2e] text-white p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-[#fdcb6e]">
          Admin - Import Words
        </h1>

        {/* Token authentication section */}
        <div className="bg-[#16213e] rounded-xl p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Authentication</h2>
          {!tokenSaved ? (
            <div>
              <p className="text-gray-400 text-sm mb-3">
                Enter the admin secret token to access word import features.
              </p>
              <div className="flex items-center gap-3">
                <input
                  type="password"
                  value={token}
                  onChange={e => setToken(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') saveToken(); }}
                  placeholder="Admin token"
                  className="flex-1 bg-[#0f3460] border border-[#2a4a7f] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#fdcb6e]"
                />
                <button
                  onClick={saveToken}
                  disabled={!token.trim()}
                  className="bg-[#fdcb6e] hover:bg-[#f39c12] disabled:bg-gray-600 text-[#1a1a2e] font-bold py-2 px-4 rounded-lg transition-colors"
                >
                  Authenticate
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <p className="text-[#2ecc71] text-sm">
                Authenticated (token saved)
              </p>
              <button
                onClick={clearToken}
                className="text-sm text-[#e74c3c] hover:underline"
              >
                Clear token
              </button>
            </div>
          )}
        </div>

        {!tokenSaved && (
          <p className="text-yellow-400 text-sm mb-6 text-center">
            Please authenticate to access the admin panel.
          </p>
        )}

        {tokenSaved && (
          <>
            <div className="bg-[#16213e] rounded-xl p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">Current Status</h2>
              {statsLoading ? (
                <p className="text-gray-400">Loading...</p>
              ) : stats?.error ? (
                <p className="text-red-400">{stats.error}</p>
              ) : (
                <div>
                  <p className="text-lg mb-2">
                    Total EN words: <span className="text-[#fdcb6e] font-bold">{stats?.total || 0}</span>
                  </p>
                  {((stats?.byLevel && Object.keys(stats.byLevel).length > 0) || (stats?.byLength && Object.keys(stats.byLength).length > 0)) && (
                    <div className="mt-3">
                      <p className="text-sm text-gray-400 mb-1">By level:</p>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries((stats!.byLevel ?? stats!.byLength ?? {}) as Record<string, number>)
                          .sort(([a], [b]) => Number(a) - Number(b))
                          .map(([level, quantity]) => (
                            <span
                              key={level}
                              className="bg-[#0f3460] px-3 py-1 rounded-full text-sm"
                            >
                              Level {level}: <strong>{quantity}</strong>
                            </span>
                          ))}
                      </div>
                    </div>
                  )}
                  {stats?.sample && stats.sample.length > 0 && (
                    <div className="mt-3">
                      <p className="text-sm text-gray-400 mb-1">Sample:</p>
                      <p className="text-[#2ecc71]">{stats.sample.join(', ')}</p>
                    </div>
                  )}
                </div>
              )}
              <button
                onClick={loadStats}
                className="mt-3 text-sm text-[#3498db] hover:underline"
              >
                Refresh
              </button>
            </div>

            <div className="bg-[#16213e] rounded-xl p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">Import Words (API)</h2>
              <p className="text-gray-400 text-sm mb-4">
                Fetches random English words from an external API and saves them to Supabase.
              </p>
              <div className="flex items-center gap-4 mb-4">
                <label className="text-sm text-gray-300">Quantity:</label>
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
                {loading ? 'Importing...' : `Import ${count} Words`}
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
                    <h3 className="text-[#2ecc71] font-bold text-lg mb-2">Import Complete</h3>
                    <p>
                      Inserted: <strong>{result.imported}</strong> of {result.total} fetched
                    </p>
                    {result.sample && (
                      <p className="text-sm text-gray-400 mt-2">
                        Sample: {result.sample.join(', ')}
                      </p>
                    )}
                  </div>
                ) : (
                  <div>
                    <h3 className="text-[#e74c3c] font-bold text-lg mb-2">Error</h3>
                    <p className="text-red-300">{result.error}</p>
                  </div>
                )}
              </div>
            )}

            <div className="bg-[#16213e] rounded-xl p-6">
              <h2 className="text-xl font-semibold mb-4">Table Schema</h2>
              <pre className="bg-[#0f3460] rounded-lg p-4 text-sm overflow-x-auto text-[#2ecc71]">
{`CREATE TABLE public.words (
    id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    word       VARCHAR(20) NOT NULL,
    language  CHAR(2) NOT NULL CHECK (language IN ('EN','PT','ES','PL','ZH')),
    level      SMALLINT NOT NULL CHECK (level BETWEEN 1 AND 3),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (word, language)
);

CREATE INDEX idx_word_lookup
  ON public.words (language, level, is_active) WHERE is_active = true;

ALTER TABLE public.words ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow read for anon"
  ON public.words FOR SELECT TO anon USING (is_active = true);
-- service_role bypasses RLS, writes only via server`}
              </pre>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
