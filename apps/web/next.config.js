/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // standalone gera um bundle mínimo para a imagem Docker de produção
  output: 'standalone',
};

module.exports = nextConfig;
