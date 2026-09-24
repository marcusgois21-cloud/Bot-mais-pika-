import type { NextConfig } from 'next'
import { execSync } from 'node:child_process'
import path from 'node:path'
import fs from 'node:fs'

function buildSha() {
  if (process.env.NEXT_PUBLIC_BUILD_SHA) return process.env.NEXT_PUBLIC_BUILD_SHA
  try {
    return execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim()
  } catch {
    return 'local'
  }
}

// Um carimbo só por build: o rodapé, o hero, o Case Nº 000 e out/metrics.json mostram a mesma data e o mesmo hash.
// Fixado em process.env no primeiro carregamento: os workers do build herdam os mesmos valores.
process.env.NEXT_PUBLIC_BUILD_SHA ||= buildSha()
process.env.NEXT_PUBLIC_BUILD_DATE ||= new Date().toISOString()
const STAMP = { sha: process.env.NEXT_PUBLIC_BUILD_SHA, date: process.env.NEXT_PUBLIC_BUILD_DATE }
try {
  fs.mkdirSync(path.resolve(__dirname, '.next'), { recursive: true })
  fs.writeFileSync(path.resolve(__dirname, '.next/gg-build.json'), JSON.stringify(STAMP))
} catch {
  /* sem permissão de escrita: measure-build cai no env / git */
}

const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  images: { unoptimized: true },
  poweredByHeader: false,
  // o repositório tem outro package-lock na raiz (bot do Discord): a raiz deste projeto é esta pasta
  turbopack: { root: path.resolve(__dirname) },
  outputFileTracingRoot: path.resolve(__dirname),
  env: {
    NEXT_PUBLIC_BUILD_SHA: STAMP.sha,
    NEXT_PUBLIC_BUILD_DATE: STAMP.date,
  },
}

export default nextConfig
