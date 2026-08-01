import type { Config } from 'tailwindcss';

/**
 * Paleta do painel: azul de planta técnica como cor institucional, âmbar de
 * sinalização para o que exige atenção. O âmbar é reservado a alerta — usá-lo
 * como enfeite tiraria dele a função de chamar o olho.
 */
export default {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        obra: {
          50: '#f2f6fa',
          100: '#e3ecf4',
          200: '#c2d6e8',
          500: '#3d6d99',
          600: '#2b5f8f',
          700: '#234d74',
          800: '#1c3c5b',
          900: '#152c43',
        },
        alerta: {
          100: '#fdf0d9',
          500: '#e8890c',
          600: '#c56f00',
        },
        risco: '#c8452f',
        ok: '#2f9e51',
      },
      fontFamily: {
        sans: ['system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
    },
  },
  plugins: [],
} satisfies Config;
