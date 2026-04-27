import { useState, useEffect, useRef } from 'react';

const API_BASE = 'https://masculine-monorail-stylist.ngrok-free.dev/api';
const POLL_MS  = 3000;

// ── Add/remove bins here ───────────────────────────────────────
const BINS = [
  { 
    id: 'powerkubo-01',
    label: 'Bin 1',
    location: 'Western Mindanao University Gate 6',
    area: 'Zone 1',
    lat: 6.913326,
    lng: 122.062425
  },
  { 
    id: 'powerkubo-02',
    label: 'Bin 2',
    location: 'Western Mindanao University Gate 3',
    area: 'Zone 2',
    lat: 6.912308,
    lng: 122.061383
  },
  { 
    id: 'powerkubo-03',
    label: 'Bin 3',
    location: 'Zamboanga City Hall',
    area: 'Zone 3',
    lat: 6.903959,
    lng: 122.076253
  },
];

const STATUS_STYLES = {
  'OK':               { bg: '#d1fae5', color: '#065f46', label: '✓ OK',               border: '#6ee7b7' },
  'Half full':        { bg: '#fef3c7', color: '#92400e', label: '⚠ Half Full',        border: '#fcd34d' },
  'Heavy':            { bg: '#ede9fe', color: '#5b21b6', label: '⚠ Heavy',            border: '#c4b5fd' },
  'Lightweight Full': { bg: '#ffedd5', color: '#9a3412', label: '⚠ Lightweight Full', border: '#fdba74' },
  'BIN FULL':         { bg: '#fee2e2', color: '#991b1b', label: '✕ BIN FULL',         border: '#fca5a5' },
};

function getLevelClass(v) {
  return v < 21 ? 'low' : v < 60 ? 'medium' : 'high';
}

// ── Notification helpers ───────────────────────────────────────
function requestNotificationPermission() {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
}

function sendNotification(title, body) {
  if (!('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;
  new Notification(title, { body, icon: '/favicon.ico' });
}

// ── Custom hook: fetch bin data ────────────────────────────────
function useBinData(deviceId) {
  const [data, setData]               = useState(null);
  const [loading, setLoading]         = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [offline, setOffline]         = useState(false);

  useEffect(() => {
    const fetch_ = async () => {
      try {
        const res = await fetch(`${API_BASE}/sensor/latest/?device_id=${deviceId}`, {
  headers: { 'ngrok-skip-browser-warning': 'true' }
});
        if (res.status === 404) { setOffline(true); setLoading(false); return; }
        if (!res.ok) throw new Error();
        setData(await res.json());
        setLastUpdated(new Date());
        setOffline(false);
      } catch {
        setOffline(true);
      } finally {
        setLoading(false);
      }
    };
    fetch_();
    const id = setInterval(fetch_, POLL_MS);
    return () => clearInterval(id);
  }, [deviceId]);

  return { data, loading, lastUpdated, offline };
}

// ── Custom hook: notifications ─────────────────────────────────
function useBinNotifications(binId, binStatus, binLevel, weightKg) {
  const lastNotified = useRef({});
  const COOLDOWN = 5 * 60 * 1000;

  useEffect(() => {
    if (!binStatus || !binId) return;
    const now      = Date.now();
    const lastTime = lastNotified.current[binId + binStatus] || 0;
    if (now - lastTime < COOLDOWN) return;

    if (binStatus === 'BIN FULL') {
      sendNotification(
        `🚨 ${binId} is FULL!`,
        `Level: ${binLevel?.toFixed(0)}% | Weight: ${weightKg?.toFixed(2)} kg — Collection needed!`
      );
      lastNotified.current[binId + binStatus] = now;
    } else if (binStatus === 'Heavy') {
      sendNotification(
        `⚠️ ${binId} is Heavy`,
        `Weight: ${weightKg?.toFixed(2)} kg — Bin may need collection soon.`
      );
      lastNotified.current[binId + binStatus] = now;
    } else if (binStatus === 'Lightweight Full') {
      sendNotification(
        `⚠️ ${binId} is Lightweight Full`,
        `Level: ${binLevel?.toFixed(0)}% — Full but lightweight. Check bin.`
      );
      lastNotified.current[binId + binStatus] = now;
    }
  }, [binStatus]);
}

// ── OpenStreetMap component ────────────────────────────────────
function BinMap({ lat, lng, label }) {
  if (!lat || !lng || lat === 0 || lng === 0) {
    return (
      <div style={{
        background: 'var(--bg-subtle)', borderRadius: 8, marginTop: 10,
        height: 140, display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexDirection: 'column', gap: 8, border: '1px dashed var(--border)'
      }}>
        <div style={{ fontSize: 28 }}>📡</div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.6 }}>
          Waiting for GPS fix…<br />
          <span style={{ fontSize: 11 }}>Take bin outside for signal</span>
        </div>
      </div>
    );
  }

  const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.001},${lat - 0.001},${lng + 0.001},${lat + 0.001}&layer=mapnik&marker=${lat},${lng}`;

  return (
    <div style={{ marginTop: 10, borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border)' }}>
      <iframe
        title={`Map - ${label}`}
        src={mapUrl}
        width="100%"
        height="200"
        style={{ border: 0, display: 'block' }}
        allowFullScreen
        loading="lazy"
      />
      <div style={{ padding: '6px 10px', background: 'var(--bg-subtle)', fontSize: 11, color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
        <span>📍 {lat.toFixed(6)}, {lng.toFixed(6)}</span>
        <a href={`https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}&zoom=17`}
          target="_blank" rel="noreferrer"
          style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 600 }}>
          Open in Maps ↗
        </a>
      </div>
    </div>
  );
}

// ── Detail Modal ───────────────────────────────────────────────
function BinDetailModal({ bin, onClose }) {
  const { data, loading, lastUpdated, offline } = useBinData(bin.id);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await fetch(`${API_BASE}/sensor/history/?device_id=${bin.id}&limit=10`, {
  headers: { 'ngrok-skip-browser-warning': 'true' }
});
        if (!res.ok) return;
        const json = await res.json();
        setHistory([...json].reverse());
      } catch {}
    };
    fetchHistory();
    const id = setInterval(fetchHistory, 5000);
    return () => clearInterval(id);
  }, [bin.id]);

  const binLevel    = data?.bin_level   ?? 0;
  const weightKg    = data?.weight_kg   ?? 0;
  const distMM      = data?.distance_mm ?? 0;
  const binStatus   = data?.bin_status  ?? 'OK';
  const isOnline    = data?.is_online   ?? false;
  const lat = (data?.latitude && data.latitude !== 0) ? data.latitude : bin.lat;
  const lng = (data?.longitude && data.longitude !== 0) ? data.longitude : bin.lng;
  const statusStyle = STATUS_STYLES[binStatus] || STATUS_STYLES['OK'];

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
      zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
    }} onClick={onClose}>
      <div style={{
        background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)',
        padding: 28, width: '100%', maxWidth: 560, maxHeight: '90vh',
        overflowY: 'auto', border: '1px solid var(--border)',
        boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
      }} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>{bin.label}</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>📍 {bin.location} — {bin.area}</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 22, color: 'var(--text-muted)', cursor: 'pointer' }}>✕</button>
        </div>

        {/* Status badge */}
        {!offline && (
  <div style={{ display: 'inline-block', padding: '6px 16px', borderRadius: 20, background: statusStyle.bg, color: statusStyle.color, fontSize: 13, fontWeight: 700, marginBottom: 20 }}>
    {statusStyle.label}
  </div>
)}

        {/* Circular progress + stats */}
        <div style={{ display: 'flex', gap: 20, alignItems: 'center', marginBottom: 20 }}>
          <div className={`circular-progress ${getLevelClass(binLevel)}`}
            style={{ '--progress': `${binLevel * 3.6}deg`, width: 120, height: 120, flexShrink: 0 }}>
            <div className="progress-content">
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1 }}>
                {loading ? '—' : `${binLevel.toFixed(0)}%`}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>FILL LEVEL</div>
            </div>
          </div>
          <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div className="status-cell"><strong>Weight</strong>{weightKg.toFixed(2)} kg</div>
            <div className="status-cell"><strong>Distance</strong>{distMM} mm</div>
            <div className="status-cell"><strong>Device</strong>{bin.id}</div>
            <div className="status-cell">
              <strong>Connection</strong>
              <span style={{ color: isOnline && !offline ? 'var(--accent)' : 'var(--accent-red)', fontWeight: 600 }}>
                {offline ? 'NO DATA' : isOnline ? 'ONLINE' : 'OFFLINE'}
              </span>
            </div>
          </div>
        </div>

        {/* Location + OpenStreetMap */}
        <div style={{ background: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)', padding: 14, marginBottom: 20, border: '1px dashed var(--border)' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Location</div>
          <div style={{ fontSize: 14, color: 'var(--text-primary)', fontWeight: 500 }}>📍 {bin.location}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{bin.area} · {bin.id}</div>
          {offline ? (
  <div style={{
    background: 'var(--bg-subtle)', borderRadius: 8, marginTop: 10,
    height: 140, display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexDirection: 'column', gap: 8, border: '1px dashed var(--border)'
  }}>
    <div style={{ fontSize: 28 }}>📵</div>
    <div style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center' }}>
      Bin not connected<br/>
      <span style={{ fontSize: 11 }}>Map will appear when device is online</span>
    </div>
  </div>
) : (
  <BinMap lat={lat} lng={lng} label={bin.label} />
)}
        </div>

        {/* Recent readings */}
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 10, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Recent Readings</div>
          {history.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', fontSize: 13, fontStyle: 'italic', padding: '12px 0' }}>No history yet</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {history.slice().reverse().slice(0, 5).map((r, i) => {
                const t  = new Date(r.timestamp);
                const st = STATUS_STYLES[r.bin_status] || STATUS_STYLES['OK'];
                return (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 70px 80px 110px', gap: 8, fontSize: 12, padding: '8px 12px', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)', alignItems: 'center', border: '1px solid var(--border)' }}>
                    <span style={{ color: 'var(--text-muted)' }}>{t.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{r.bin_level.toFixed(0)}%</span>
                    <span style={{ color: 'var(--text-secondary)' }}>{r.weight_kg.toFixed(2)} kg</span>
                    <span style={{ background: st.bg, color: st.color, padding: '2px 8px', borderRadius: 20, fontSize: 10, fontWeight: 700, textAlign: 'center' }}>{r.bin_status}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {lastUpdated && (
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 16, textAlign: 'right' }}>
            Last updated: {lastUpdated.toLocaleTimeString()}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Bin Card ───────────────────────────────────────────────────
function BinCard({ bin, onClick }) {
  const { data, loading, lastUpdated, offline } = useBinData(bin.id);

  const binLevel    = data?.bin_level   ?? 0;
  const weightKg    = data?.weight_kg   ?? 0;
  const distMM      = data?.distance_mm ?? 0;
  const binStatus   = data?.bin_status  ?? 'OK';
  const isOnline    = data?.is_online   ?? false;
  const statusStyle = STATUS_STYLES[binStatus] || STATUS_STYLES['OK'];

  useBinNotifications(bin.id, binStatus, binLevel, weightKg);

  return (
    <div onClick={onClick} style={{
      background: 'var(--bg-card)',
      border: `1px solid ${offline ? '#fca5a5' : statusStyle.border}`,
      borderRadius: 'var(--radius-md)', padding: 20,
      display: 'flex', flexDirection: 'column', gap: 12,
      boxShadow: 'var(--shadow-sm)', cursor: 'pointer',
      transition: 'transform 0.15s, box-shadow 0.15s',
    }}
    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }}
    onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; }}>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{bin.label}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>📍 {bin.location}</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span className={`status-dot ${isOnline && !offline ? 'online' : 'offline'}`} />
            <span style={{ fontSize: 10, fontWeight: 600, color: isOnline && !offline ? 'var(--accent)' : 'var(--accent-red)' }}>
              {offline ? 'NO DATA' : isOnline ? 'ONLINE' : 'OFFLINE'}
            </span>
          </div>
          <span style={{ fontSize: 10, color: 'var(--text-muted)', fontStyle: 'italic' }}>Click for details</span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div className={`circular-progress ${getLevelClass(binLevel)}`}
          style={{ '--progress': `${binLevel * 3.6}deg`, width: 88, height: 88, flexShrink: 0 }}>
          <div className="progress-content">
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1 }}>
              {loading ? '—' : `${binLevel.toFixed(0)}%`}
            </div>
          </div>
        </div>
       <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
  <div className="status-cell" style={{ padding: '5px 10px', fontSize: 12 }}>
    <strong>Weight</strong>{offline ? '—' : `${weightKg.toFixed(2)} kg`}
  </div>
  <div className="status-cell" style={{ padding: '5px 10px', fontSize: 12 }}>
    <strong>Distance</strong>{offline ? '—' : `${distMM} mm`}
  </div>
</div>
      </div>

      {!offline && (
        <div style={{ display: 'inline-block', padding: '4px 12px', borderRadius: 20, width: 'fit-content', background: statusStyle.bg, color: statusStyle.color, fontSize: 11, fontWeight: 700 }}>{statusStyle.label}</div>
      )}

      {lastUpdated && <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: -6 }}>Updated {lastUpdated.toLocaleTimeString()}</div>}
    </div>
  );
}

// ── Summary Bar ────────────────────────────────────────────────
function SummaryBar() {
  const [summaries, setSummaries] = useState([]);

  useEffect(() => {
    const fetchAll = async () => {
      const results = await Promise.all(
        BINS.map(async (bin) => {
          try {
            const res = await fetch(`${API_BASE}/sensor/latest/?device_id=${bin.id}`, {
  headers: { 'ngrok-skip-browser-warning': 'true' }
});
            if (!res.ok) return { status: 'offline' };
            const data = await res.json();
            return { status: data.bin_status };
          } catch { return { status: 'offline' }; }
        })
      );
      setSummaries(results);
    };
    fetchAll();
    const id = setInterval(fetchAll, POLL_MS);
    return () => clearInterval(id);
  }, []);

  const count   = (s) => summaries.filter(x => x.status === s).length;
  const okCount = summaries.filter(x => x.status === 'OK' || x.status === 'Half full').length;
  const offline = summaries.filter(x => x.status === 'offline').length;

  const Stat = ({ label, value, color }) => (
    <div style={{ textAlign: 'center', padding: '10px 20px', background: 'var(--bg-card)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', flex: 1, minWidth: 80 }}>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, color }}>{value}</div>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{label}</div>
    </div>
  );

  return (
    <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap' }}>
      <Stat label="Total Bins"       value={BINS.length}               color="var(--text-primary)" />
      <Stat label="OK"               value={okCount}                   color="var(--accent)"       />
      <Stat label="Bin Full"         value={count('BIN FULL')}         color="var(--accent-red)"   />
      <Stat label="Heavy"            value={count('Heavy')}            color="#7c3aed"             />
      <Stat label="Lightweight Full" value={count('Lightweight Full')} color="#ea580c"             />
      <Stat label="Offline"          value={offline}                   color="var(--text-muted)"   />
    </div>
  );
}

// ── Main Dashboard ─────────────────────────────────────────────
export default function Dashboard() {
  const [selectedBin, setSelectedBin] = useState(null);

  useEffect(() => {
    requestNotificationPermission();
  }, []);

  return (
    <>
      <div className="section-title">
        Waste Bin Dashboard
        <span className="title-badge">LIVE</span>
        <span style={{ marginLeft: 'auto', fontSize: 12, fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: 'var(--text-muted)' }}>
          {BINS.length} bin{BINS.length > 1 ? 's' : ''} monitored · click a bin for details
        </span>
      </div>

      <SummaryBar />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
        {BINS.map(bin => (
          <BinCard key={bin.id} bin={bin} onClick={() => setSelectedBin(bin)} />
        ))}
      </div>

      {selectedBin && <BinDetailModal bin={selectedBin} onClose={() => setSelectedBin(null)} />}
    </>
  );
}
