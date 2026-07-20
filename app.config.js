// Estende app.json (gia' fuso automaticamente in `config`) solo per la
// build web statica destinata a GitHub Pages, servita da un sottopercorso
// invece che dalla radice del dominio. La variabile e' impostata solo nel
// comando di export usato per quel deploy, quindi non tocca `npm start`,
// `npm run web` in locale o le build native EAS.
module.exports = ({ config }) => {
  const basePath = process.env.EXPO_PUBLIC_BASE_PATH;
  if (!basePath) return config;
  return {
    ...config,
    experiments: { ...(config.experiments ?? {}), baseUrl: basePath },
  };
};
