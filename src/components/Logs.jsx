import { useState, useEffect } from 'react';

const API_BASE  = 'https://masculine-monorail-stylist.ngrok-free.dev/api';
const DEVICE_ID = 'powerkubo-01';

const EVENT_META = {
  pickup:  { label: 'Pickup',  bg: '#d1fae5', color: '#065f46' },
  alert:   { label: 'Alert',   bg: '#fee2e2', color: '#991b1b' },
  warning: { label: 'Warning', bg: '#fef3c7', color: '#92400e' },
  info:    { label: 'Info',    bg: '#e0e7ff', color: '#3730a3' },
};

export default function Logs() {
  const [logs, setLogs]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  // fetchLogs is outside useEffect so the Refresh button can call it too
  const fetchLogs = async () => {
    try {
      const res = await fetch(`${API_BASE}/logs/?device_id=${DEVICE_ID}&limit=100`, {
  headers: { 'ngrok-skip-browser-warning': 'true' },
});
      if (!res.ok) throw new Error('Failed');
      setLogs(await res.json());
      setError(null);
    } catch {
      setError('Cannot reach backend — is Django running on port 8000?');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    const id = setInterval(fetchLogs, 3000); // refresh every 3 seconds
    return () => clearInterval(id);
  }, []);

  const fmt = (iso) => {
    const d = new Date(iso);
    return {
      date: d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }),
      time: d.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' }),
    };
  };

  return (
    <>
      <div className="section-title">
        Event Logs
        <button
          onClick={fetchLogs}
          style={{
            marginLeft: 'auto', padding: '4px 14px', borderRadius: 20,
            border: '1px solid var(--border)', background: 'var(--bg-card)',
            color: 'var(--text-secondary)', fontSize: 12, cursor: 'pointer',
            fontFamily: 'var(--font-body)'
          }}>
          ↻ Refresh
        </button>
      </div>

      {error && <div className="error-banner">⚠️ {error}</div>}

      <div className="logs-container">
        {loading ? (
          <div className="empty-state">Loading logs…</div>
        ) : logs.length === 0 ? (
          <div className="empty-state">
            No logs yet.<br />
            Pickup events and threshold alerts will appear here.
          </div>
        ) : (
          <>
            <div className="logs-header">
              <span>Event</span>
              <span>Bin / Weight</span>
              <span>Date &amp; Time</span>
            </div>
            {logs.map(log => {
              const { date, time } = fmt(log.timestamp);
              const meta = EVENT_META[log.event_type] || EVENT_META.info;
              return (
                <div className="log-row" key={log.id}>
                  <div>
                    <span className="log-badge"
                      style={{ background: meta.bg, color: meta.color }}>
                      {meta.label}
                    </span>
                    <span className="log-message">{log.message}</span>
                  </div>
                  <div className="log-meta">
                    {log.bin_level != null ? `${log.bin_level.toFixed(0)}%` : '—'}
                    {log.weight_kg != null ? ` · ${log.weight_kg.toFixed(2)} kg` : ''}
                  </div>
                  <div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{date}</div>
                    <div className="log-time">{time}</div>
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>
    </>
  );
}
