import type { Config } from 'tailwindcss';
import plugin from 'tailwindcss/plugin';

/**
 * Design tokens for the "Ledger / System Log" system.
 *
 * Rules this config exists to enforce:
 *
 *  1. Every colour a component can reach for lives here. Components use
 *     `bg-surface` / `text-text-muted` / `border-border` — never an arbitrary
 *     value like `bg-[#131820]`. If a colour is missing from this file, it is
 *     not part of the system, and adding it is a deliberate decision made here
 *     rather than an accident made in a JSX file.
 *  2. Typography is three roles, not three font names: `font-display` for
 *     headings/labels/status text, `font-body` for prose, `font-mono` for
 *     tags, timestamps and figures. Display and mono happen to resolve to the
 *     same family today; keeping them separate means the display face can
 *     change later without touching every tag in the codebase.
 *  3. Radii stop at 2px. This is a technical readout, not a consumer app.
 *
 * The `var(--font-*)` entries are injected by `next/font` in `lib/fonts.ts`.
 * The literal family names after them are the fallback used before the
 * stylesheet resolves, and in any environment where `next/font` is not active.
 */

const config: Config = {
  // Explicit content globs. `lib/**` is included because status/label maps that
  // hold class names (see `lib/status.ts`) live there, and Tailwind only emits
  // classes it can see as complete strings in a scanned file.
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],

  // The palette is designed for a dark surface only; there is no light theme to
  // toggle to, so the `dark:` variant is intentionally never used.
  darkMode: 'class',

  theme: {
    // `extend` rather than a bare `theme` block: Tailwind's spacing scale,
    // breakpoints and type ramp are kept, and only the brand layer is added.
    extend: {
      colors: {
        ink: '#0B0E11', // page background — the deepest surface
        surface: '#131820', // cards, ledger rows, form fields
        border: '#232B35', // hairline dividers; never a shadow

        text: {
          primary: '#EDEFF2', // 14.9:1 on ink — AAA
          muted: '#8A94A3', // 6.1:1 on ink — AA for body, AA-large everywhere
        },

        accent: {
          // Amber is the only colour allowed to raise its voice: primary CTAs,
          // focus rings, the live status dot. Using it twice in one viewport is
          // usually a mistake.
          amber: '#E8A33D',
          // Blue is for data: links, counts, inline references.
          blue: '#4C8DB5',
        },

        status: {
          live: '#4ADE80',
          progress: '#E8A33D',
          archived: '#5A6472',
        },
      },

      fontFamily: {
        display: ['var(--font-plex-mono)', 'IBM Plex Mono', 'ui-monospace', 'monospace'],
        body: ['var(--font-inter)', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['var(--font-plex-mono)', 'IBM Plex Mono', 'ui-monospace', 'monospace'],
      },

      fontSize: {
        // A single addition to the default ramp: the micro label used for
        // ledger indices, status badges and eyebrow text. Pairing the size with
        // its tracking here stops every usage from repeating `tracking-[0.18em]`.
        label: ['0.6875rem', { lineHeight: '1rem', letterSpacing: '0.14em' }],
        // Smaller still: tech-stack chips, where a dense row of six tags has to
        // stay legible without dominating the summary above it.
        micro: ['0.625rem', { lineHeight: '0.875rem', letterSpacing: '0.08em' }],
      },

      letterSpacing: {
        tightest: '-0.04em', // display headings only
        ui: '0.12em', // buttons and interactive labels
        brand: '0.18em', // the wordmark and nav links
      },

      borderRadius: {
        // `rounded-sm` is the ceiling. `rounded-none` is the default.
        sm: '2px',
      },

      maxWidth: {
        content: '64rem', // max-w-5xl equivalent, named by intent
      },

      spacing: {
        // The desktop ledger rail: a hairline at 1px, offset by 2.5rem so row
        // content clears the monospace index printed beside it.
        rail: '2.5rem',
      },

      transitionDuration: {
        // Hover/press feedback. Anything slower reads as lag on a dense list.
        hover: '150ms',
      },

      keyframes: {
        // Used only by the status dot. Everything else animates through Framer
        // Motion so `prefers-reduced-motion` is handled in one place.
        pulse_dot: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.35' },
        },
      },

      animation: {
        'pulse-dot': 'pulse_dot 2.4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },

  plugins: [
    /**
     * `focus-ring` — the single source of truth for keyboard focus.
     *
     * Every interactive element in the app applies this class. Centralising it
     * means the accessibility requirement ("visible focus ring on every
     * interactive element") is satisfied by one definition that cannot drift
     * between a button and an accordion row, and a review can verify it by
     * grepping for the class rather than auditing every component.
     */
    plugin(({ addComponents, theme }) => {
      addComponents({
        '.focus-ring': {
          '&:focus-visible': {
            outline: '2px solid transparent',
            outlineOffset: '2px',
            boxShadow: `0 0 0 2px ${theme('colors.ink')}, 0 0 0 4px ${theme('colors.accent.amber')}`,
          },
        },
      });
    }),
  ],
};

export default config;
