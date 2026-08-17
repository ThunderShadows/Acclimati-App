import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// Dev-only proxy so the API tester calls the Edge Function same-origin and
// avoids CORS (a terminal curl never hits this — only browsers enforce it).
// The tester calls "/fn/*"; this forwards it to VITE_FUNCTION_URL's origin.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const functionUrl = env.VITE_FUNCTION_URL ?? '';
  const target = functionUrl ? new URL(functionUrl).origin : undefined;

  return {
    plugins: [react()],
    server: target
      ? {
          proxy: {
            '/fn': {
              target,
              changeOrigin: true,
              rewrite: (path) => path.replace(/^\/fn/, new URL(functionUrl).pathname),
            },
          },
        }
      : undefined,
  };
});
