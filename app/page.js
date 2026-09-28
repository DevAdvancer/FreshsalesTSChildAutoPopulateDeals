'use client';

import { useEffect, useRef, useState } from 'react';

export default function Dashboard() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const activeRequest = useRef(null);

  const fetchLogs = async () => {
    activeRequest.current?.abort();
    const controller = new AbortController();
    activeRequest.current = controller;
    setLoading(true);
    setError(null);
    setLogs([]);
    try {
      let cursor = null;
      do {
        const url = cursor ? `/api/logs?cursor=${encodeURIComponent(cursor)}` : '/api/logs';
        const res = await fetch(url, { signal: controller.signal, cache: 'no-store' });
        if (!res.ok) throw new Error('Failed to fetch logs');
        const page = await res.json();
        if (controller.signal.aborted) break;
        setLogs(previous => [...previous, ...page]);
        cursor = res.headers.get('X-Next-Cursor') || null;
      } while (cursor && !controller.signal.aborted);
    } catch (err) {
      if (err.name !== 'AbortError') setError(err.message);
    } finally {
      if (activeRequest.current === controller) {
        setLoading(false);
        activeRequest.current = null;
      }
    }
  };

  useEffect(() => {
    fetchLogs();
    return () => activeRequest.current?.abort();
  }, []);

  return (
    <div className="container">
      <header>
        <h1>Webhook Logs Dashboard</h1>
        <button className="refresh-btn" onClick={fetchLogs} disabled={loading}>
          {loading ? 'Refreshing...' : 'Refresh Logs'}
        </button>
      </header>

      <div className="loading">{loading ? `Loading all logs… ${logs.length} loaded` : `${logs.length} logs`}</div>

      <div className="log-list">
        {loading && logs.length === 0 && <div className="loading">Loading logs from database...</div>}
        {error && <div className="error">{error}</div>}
        
        {!loading && !error && logs.length === 0 && (
          <div className="loading">No logs found in the database.</div>
        )}

        {logs.map(log => {
          const date = new Date(log.timestamp).toLocaleString();
          return (
            <div key={log._id} className="log-card">
              <div className="log-header">
                <div>
                  <span className={`log-status status-${log.status}`}>{log.status}</span>
                  {log.dealId && <span className="log-deal">Deal: {log.dealId}</span>}
                </div>
                <div className="log-time">{date}</div>
              </div>
              <div className="log-message">{log.message}</div>
              {log.payload && (
                <pre className="log-payload">{JSON.stringify(log.payload, null, 2)}</pre>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
