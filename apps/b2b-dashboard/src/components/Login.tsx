import { useState } from 'react';
import { supabase } from '../supabaseClient';
import { Colors } from '../theme';

export default function Login() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        if (!companyName.trim()) throw new Error('Company name is required.');

        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;

        // If email confirmation is off, we get a session immediately and can
        // create the partner record now. If confirmation is required, this
        // has to happen on first sign-in instead (data.session is null here).
        if (data.session && data.user) {
          const { error: partnerError } = await supabase
            .from('partners')
            .insert({ user_id: data.user.id, company_name: companyName.trim() });
          if (partnerError) throw partnerError;
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.wrap}>
      <form style={styles.card} onSubmit={handleSubmit}>
        <h1 style={styles.title}>Acclimate for Business</h1>
        <p style={styles.subtitle}>
          {mode === 'signin' ? 'Sign in to manage your API keys.' : 'Create a partner account.'}
        </p>

        {mode === 'signup' && (
          <label style={styles.field}>
            <span style={styles.label}>Company name</span>
            <input
              style={styles.input}
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Acme Travel Co."
              required
            />
          </label>
        )}

        <label style={styles.field}>
          <span style={styles.label}>Email</span>
          <input
            style={styles.input}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>

        <label style={styles.field}>
          <span style={styles.label}>Password</span>
          <input
            style={styles.input}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={6}
            required
          />
        </label>

        {error && <p style={styles.error}>{error}</p>}

        <button style={styles.submit} type="submit" disabled={loading}>
          {loading ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Sign up'}
        </button>

        <button
          type="button"
          style={styles.toggle}
          onClick={() => {
            setMode(mode === 'signin' ? 'signup' : 'signin');
            setError(null);
          }}
        >
          {mode === 'signin' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
        </button>
      </form>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrap: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    background: Colors.surface,
    borderRadius: 16,
    padding: 32,
    border: `1px solid ${Colors.border}`,
  },
  title: { margin: '0 0 4px', fontSize: 22, color: Colors.primary },
  subtitle: { margin: '0 0 24px', fontSize: 14, color: Colors.inkSoft },
  field: { display: 'block', marginBottom: 16 },
  label: { display: 'block', fontSize: 13, color: Colors.inkSoft, marginBottom: 6 },
  input: {
    width: '100%',
    padding: '10px 12px',
    borderRadius: 8,
    border: `1px solid ${Colors.border}`,
    fontSize: 14,
  },
  error: { color: Colors.coral, fontSize: 13, marginBottom: 16 },
  submit: {
    width: '100%',
    padding: '12px 16px',
    borderRadius: 8,
    border: 'none',
    background: Colors.primary,
    color: '#fff',
    fontSize: 15,
    fontWeight: 600,
  },
  toggle: {
    width: '100%',
    marginTop: 12,
    padding: 8,
    background: 'none',
    border: 'none',
    color: Colors.mid,
    fontSize: 13,
  },
};
