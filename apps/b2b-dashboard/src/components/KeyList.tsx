import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { Colors } from '../theme';

interface ApiKeyRow {
  id: string;
  key_name: string;
  prefix: string;
  created_at: string;
}

export default function KeyList({ refreshToken }: { refreshToken: number }) {
  const [keys, setKeys] = useState<ApiKeyRow[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    // No user_id filter — RLS ("Partners manage their own API keys") already
    // scopes this to the signed-in partner.
    const { data } = await supabase
      .from('api_keys')
      .select('id, key_name, prefix, created_at')
      .order('created_at', { ascending: false });
    setKeys(data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [refreshToken]);

  async function handleDelete(id: string) {
    if (!confirm('Revoke this key? Any requests using it will start failing immediately.')) return;
    await supabase.from('api_keys').delete().eq('id', id);
    load();
  }

  return (
    <section style={styles.section}>
      <h2 style={styles.heading}>Your keys</h2>
      {loading ? (
        <p style={{ color: Colors.inkFaint, fontSize: 13 }}>Loading…</p>
      ) : keys.length === 0 ? (
        <p style={{ color: Colors.inkFaint, fontSize: 13 }}>No keys yet — create one above.</p>
      ) : (
        <table style={styles.table}>
          <tbody>
            {keys.map((k) => (
              <tr key={k.id}>
                <td style={styles.cell}>{k.key_name}</td>
                <td style={{ ...styles.cell, ...styles.mono }}>{k.prefix}••••••••••••••••••••</td>
                <td style={{ ...styles.cell, color: Colors.inkFaint }}>
                  {new Date(k.created_at).toLocaleDateString()}
                </td>
                <td style={styles.cell}>
                  <button style={styles.deleteButton} onClick={() => handleDelete(k.id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
  table: { width: '100%', borderCollapse: 'collapse' },
  cell: { padding: '10px 8px', borderBottom: `1px solid ${Colors.border}`, fontSize: 14, textAlign: 'left' },
  mono: { fontFamily: 'monospace', fontSize: 13, color: Colors.inkSoft },
  deleteButton: {
    padding: '6px 12px',
    borderRadius: 6,
    border: `1px solid ${Colors.coral}`,
    background: '#fff',
    color: Colors.coral,
    fontSize: 13,
  },
};
