import { useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../supabaseClient';
import { Colors } from '../theme';
import CreateKey from './CreateKey';
import KeyList from './KeyList';
import Tester from './Tester';

export default function Dashboard({ session }: { session: Session }) {
  const [refreshToken, setRefreshToken] = useState(0);

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div>
          <h1 style={styles.title}>Acclimate for Business</h1>
          <p style={styles.subtitle}>{session.user.email}</p>
        </div>
        <button style={styles.signOut} onClick={() => supabase.auth.signOut()}>
          Sign out
        </button>
      </header>

      <main style={styles.main}>
        <CreateKey onCreated={() => setRefreshToken((n) => n + 1)} />
        <KeyList refreshToken={refreshToken} />
        <Tester />
      </main>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { minHeight: '100vh' },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px 32px',
    borderBottom: `1px solid ${Colors.border}`,
    background: Colors.surface,
  },
  title: { margin: 0, fontSize: 18, color: Colors.primary },
  subtitle: { margin: 0, fontSize: 13, color: Colors.inkFaint },
  signOut: {
    padding: '8px 14px',
    borderRadius: 8,
    border: `1px solid ${Colors.border}`,
    background: '#fff',
    color: Colors.ink,
    fontSize: 13,
  },
  main: {
    maxWidth: 640,
    margin: '0 auto',
    padding: '32px 24px',
  },
};
