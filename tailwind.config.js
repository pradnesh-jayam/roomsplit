export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0f0f0f',
        surface: '#1a1a1a',
        card: '#242424',
        primary: '#6366f1',
        positive: '#22c55e',
        negative: '#ef4444',
        'text-primary': '#f5f5f5',
        'text-muted': '#888888',
      }
    },
  },
  plugins: [],
}
