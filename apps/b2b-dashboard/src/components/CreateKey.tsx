import { useState } from 'react';
import { supabase } from '../supabaseClient';
import { Colors } from '../theme';

export default function CreateKey({ onCreated }: { onCreated: () => void }) {
  const [keyName, setKeyName] = useState('');
  const [rawKey, setRawKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!keyName.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.rpc('generate_api_key', { key_name: keyName.trim() });
      if (error) throw error;
      setRawKey(data as string);
      setKeyName('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create key.');
    } finally {
      setLoading(false);
    }
  }

  function handleCopy() {
    if (!rawKey) return;
    navigator.clipboard.writeText(rawKey);
    setCopied(true);
  }

  function handleDone() {
    setRawKey(null);
    setCopied(false);
    onCreated();
  }

  return (
    <section style={styles.section}>
      <h2 style={styles.heading}>Create a key</h2>
      <form style={styles.row} onSubmit={handleCreate}>
        <input
          style={styles.input}
          placeholder="Key name (e.g. Production)"
          value={keyName}
          onChange={(e) => setKeyName(e.target.value)}
        />
        <button style={styles.button} type="submit" disabled={loading}>
          {loading ? 'Creating…' : 'Create'}
        </button>
      </form>
      {error && <p style={{ color: Colors.coral, fontSize: 13 }}>{error}</p>}

      {rawKey && (
        <div style={styles.overlay}>
          <div style={styles.modal}>
            <h3 style={{ marginTop: 0 }}>Your new API key</h3>
            <p style={{ color: Colors.coral, fontSize: 13, fontWeight: 600 }}>
              This is the only time you'll see this key. Copy it now.
            </p>
            <code style={styles.keyBox}>{rawKey}</code>
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button style={styles.button} type="button" onClick={handleCopy}>
                {copied ? 'Copied ✓' : 'Copy'}
              </button>
              <button style={styles.buttonSecondary} type="button" onClick={handleDone}>
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

const styles: Record<string, React.CSSProperties> = {
  section: {
    background: Colors.surface,
    border: `1px solid ${Colors.border}`,
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  heading: { margin: '0 0 12px', fontSize: 16, color: Colors.primary },
  row: { display: 'flex', gap: 8 },
  input: {
    flex: 1,
    padding: '10px 12px',
    borderRadius: 8,
    border: `1px solid ${Colors.border}`,
    fontSize: 14,
  },
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
    padding: '10px 16px',
    borderRadius: 8,
    border: `1px solid ${Colors.border}`,
    background: '#fff',
    color: Colors.ink,
    fontSize: 14,
  },
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(11, 31, 34, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  modal: {
    background: '#fff',
    borderRadius: 16,
    padding: 28,
    width: '100%',
    maxWidth: 440,
  },
  keyBox: {
    display: 'block',
    background: Colors.bg,
    border: `1px solid ${Colors.border}`,
    borderRadius: 8,
    padding: 12,
    fontSize: 13,
    wordBreak: 'break-all',
    marginTop: 12,
  },
};
