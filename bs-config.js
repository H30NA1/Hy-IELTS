module.exports = {
  proxy: "localhost:8080",
  files: [
    "public/*.{html,css,js}",
    "server.js"
  ],
  ignore: [
    "node_modules/**/*",
    "data/**/*",
    "*.pdf",
    "pdfs/**/*",
    "questions/**/*.json"
  ],
  reloadDelay: 500,
  reloadDebounce: 300,
  reloadThrottle: 300,
  notify: false,
  open: false,
  port: 3000,
  ui: {
    port: 3001
  },
  watchEvents: ['change'],
  watch: true,
  single: true
}; 