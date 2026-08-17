import { useState } from 'react';
import { Colors } from '../theme';

const SAMPLE_PROFILE = {
  age_group: '35_55',
  fitness_level: 'moderate',
  diet_type: 'vegetarian',
  hydration_level: 'moderate',
  allergy_type: 'none',
  has_respiratory_condition: false,
  has_cardiac_condition: false,
  is_recovering_from_illness: false,
  is_sleep_sensitive: false,
  has_ac_accommodation: true,
  activity_type: 'sightseeing',
  travel_mode: 'flight',
  stay_duration_days: 5,
};

// In dev, call the Vite proxy (see vite.config.ts) to avoid CORS. In a
// deployed build, call the Edge Function directly — the browser origin is
// different but the function itself sets permissive CORS.
const FUNCTION_ENDPOINT = import.meta.env.DEV ? '/fn' : import.meta.env.VITE_FUNCTION_URL;

type StatusKind = 'ok' | 'client_error' | 'server_error' | null;

function statusKind(status: number): StatusKind {
  if (status >= 200 && status < 300) return 'ok';
  if (status === 401 || status === 429 || status === 404 || status === 400) return 'client_error';
  return 'server_error';
}

export default function Tester() {
  const [apiKey, setApiKey] = useState('');
  const [originId, setOriginId] = useState('DEL');
  const [destId, setDestId] = useState('IXL');
  const [month, setMonth] = useState(7);
  const [profileJson, setProfileJson] = useState(JSON.stringify(SAMPLE_PROFILE, null, 2));
  const [status, setStatus] = useState<number | null>(null);
  const [response, setResponse] = useState<string>('');
  const [loading, setLoading] = useState(false);

  async function handleSend() {
    setLoading(true);
    setStatus(null);
    setResponse('');

    let profile: unknown;
    try {
      profile = JSON.parse(profileJson);
    } catch {
      setResponse('Profile is not valid JSON.');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(FUNCTION_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'x-api-key': apiKey,
        },
        body: JSON.stringify({
          origin_city_id: originId,
          dest_city_id: destId,
          month,
          profile,
        }),
      });
      setStatus(res.status);
      const body = await res.json();
      setResponse(JSON.stringify(body, null, 2));
    } catch (err) {
      setResponse(err instanceof Error ? err.message : 'Request failed.');
    } finally {
      setLoading(false);
    }
  }

  const kind = status !== null ? statusKind(status) : null;
  const statusColor =
    kind === 'ok' ? Colors.green : kind === 'client_error' ? Colors.coral : kind === 'server_error' ? Colors.amber : Colors.inkFaint;

  return (
    <section style={styles.section}>
      <h2 style={styles.heading}>API tester</h2>

      <label style={styles.field}>
        <span style={styles.label}>API key</span>
        <input
          style={styles.input}
          type="password"
          placeholder="sk_live_..."
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
        />
      </label>

      <div style={styles.row}>
        <label style={{ ...styles.field, flex: 1 }}>
          <span style={styles.label}>Origin city ID</span>
          <input style={styles.input} value={originId} onChange={(e) => setOriginId(e.target.value.toUpperCase())} />
        </label>
        <label style={{ ...styles.field, flex: 1 }}>
          <span style={styles.label}>Destination city ID</span>
          <input style={styles.input} value={destId} onChange={(e) => setDestId(e.target.value.toUpperCase())} />
        </label>
        <label style={{ ...styles.field, width: 100 }}>
          <span style={styles.label}>Month</span>
          <input
            style={styles.input}
            type="number"
            min={1}
            max={12}
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
          />
        </label>
      </div>

      <label style={styles.field}>
        <span style={styles.label}>Traveler profile (JSON)</span>
        <textarea
          style={{ ...styles.input, ...styles.mono, height: 180 }}
          value={profileJson}
          onChange={(e) => setProfileJson(e.target.value)}
        />
      </label>
      <button
        type="button"
        style={styles.buttonSecondary}
        onClick={() => setProfileJson(JSON.stringify(SAMPLE_PROFILE, null, 2))}
      >
        Load sample profile
      </button>

      <div style={{ marginTop: 16 }}>
        <button style={styles.button} onClick={handleSend} disabled={loading || !apiKey}>
          {loading ? 'Sending…' : 'Send request'}
        </button>
      </div>

      {status !== null && (
        <p style={{ marginTop: 16, marginBottom: 4 }}>
          <strong style={{ color: statusColor }}>HTTP {status}</strong>
        </p>
      )}
      {response && <pre style={styles.responseBox}>{response}</pre>}
    </section>
  );
}

const styles: Record<string, React.CSSProperties> = {
  section: {
    background: Colors.surface,
    border: `1px solid ${Colors.border}`,
    borderRadius: 12,
    padding: 20,
  },
  heading: { margin: '0 0 12px', fontSize: 16, color: Colors.primary },
  row: { display: 'flex', gap: 12 },
  field: { display: 'block', marginBottom: 14 },
  label: { display: 'block', fontSize: 13, color: Colors.inkSoft, marginBottom: 6 },
  input: {
    width: '100%',
    padding: '10px 12px',
    borderRadius: 8,
    border: `1px solid ${Colors.border}`,
    fontSize: 14,
  },
  mono: { fontFamily: 'monospace', fontSize: 13, resize: 'vertical' },
  button: {
    padding: '10px 16px',
    borderRadius: 8,
    border: 'none',
    background: Colors.primary,
    color: '#fff',
    fontSize: 14,
    fontWeight: 600,
  },
  buttonSecondary: {
    padding: '8px 14px',
    borderRadius: 8,
    border: `1px solid ${Colors.border}`,
    background: '#fff',
    color: Colors.ink,
    fontSize: 13,
  },
  responseBox: {
    marginTop: 8,
    background: Colors.bg,
    border: `1px solid ${Colors.border}`,
    borderRadius: 8,
    padding: 14,
    fontSize: 12.5,
    maxHeight: 400,
    overflow: 'auto',
  },
};
