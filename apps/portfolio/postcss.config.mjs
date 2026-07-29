/**
 * Tailwind 3 runs as a PostCSS plugin; autoprefixer handles the vendor
 * prefixes Next's browserslist target still needs.
 */
const config = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};

export default config;
