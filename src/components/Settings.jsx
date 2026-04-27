import { useState, useEffect } from 'react';

const API_BASE  = 'https://masculine-monorail-stylist.ngrok-free.dev/api';
const DEVICE_ID = 'powerkubo-01';

export default function Settings() {
  const [settings, setSettings] = useState(null);
  const [saving, setSaving]     = useState(false);
  const [saved, setSaved]       = useState(false);
  const [error, setError]       = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/settings/?device_id=${DEVICE_ID}`, {
  headers: { 'ngrok-skip-browser-warning': 'true' }
});
        if (!res.ok) throw new Error('Failed');
        setSettings(await res.json());
      } catch {
        setError('Cannot reach backend — is Django running on port 8000?');
      }
    })();
  }, []);

  const patch = async (field, value) => {
    setSettings(s => ({ ...s, [field]: value }));
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch(`${API_BASE}/settings/?device_id=${DEVICE_ID}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'
         },
        body: JSON.stringify({ [field]: value }),
      });
      if (!res.ok) throw new Error('Save failed');
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      setError('Failed to save — is Django running?');
    } finally {
      setSaving(false);
    }
  };

  const Toggle = ({ field }) => (
    <label className="toggle-switch">
      <input
        type="checkbox"
        checked={settings?.[field] ?? false}
        onChange={e => patch(field, e.target.checked)}
      />
      <span className="slider" />
    </label>
  );

  return (
    <>
      <div className="section-title">
        Settings
        {saving && <span style={{ marginLeft:'auto', fontSize:12, fontWeight:400,
          textTransform:'none', letterSpacing:0, color:'var(--text-muted)' }}>Saving…</span>}
        {saved  && <span style={{ marginLeft:'auto', fontSize:12, fontWeight:400,
          textTransform:'none', letterSpacing:0, color:'var(--accent)' }}>✓ Saved</span>}
      </div>

      {error && <div className="error-banner">⚠️ {error}</div>}

      <div className="settings-container">

        <div className="setting-item">
          <div>
            <div className="setting-label">Enable Push Notifications</div>
            <div className="setting-desc">Receive alerts on mobile/web when the bin needs attention</div>
          </div>
          <Toggle field="push_notifications" />
        </div>

        <div className="setting-item">
          <div>
            <div className="setting-label">
              Alert Threshold — {settings?.alert_threshold ?? 80}% full
            </div>
            <div className="setting-desc">Auto-log an alert when fill level exceeds this value</div>
          </div>
          <span style={{ fontFamily:'var(--font-display)', fontSize:20, fontWeight:700,
            color:'var(--accent)' }}>
            {settings?.alert_threshold ?? 80}%
          </span>
        </div>
        

        <div className="setting-item">
          <div>
            <div className="setting-label">Send Daily Summary Report</div>
            <div className="setting-desc">Push a daily summary of bin status and pickups</div>
          </div>
          <Toggle field="daily_summary" />
        </div>

        <div className="setting-item">
          <div>
            <div className="setting-label">Enable Device Sound Alerts</div>
            <div className="setting-desc">The bin beeps locally when full or on critical events</div>
          </div>
          <Toggle field="sound_alerts" />
        </div>

      </div>
    </>
  );
}
