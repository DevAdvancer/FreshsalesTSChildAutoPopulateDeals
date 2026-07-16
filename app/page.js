'use client';

import { useEffect, useState } from 'react';

export default function Dashboard() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/logs');
      if (!res.ok) throw new Error('Failed to fetch logs');
      const data = await res.json();
      setLogs(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <div className="container">
      <header>
        <h1>Webhook Logs Dashboard</h1>
        <button className="refresh-btn" onClick={fetchLogs} disabled={loading}>
          {loading ? 'Refreshing...' : 'Refresh Logs'}
        </button>
      </header>

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
