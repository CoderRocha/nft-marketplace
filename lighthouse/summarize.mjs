import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { arch, cpus, platform, release, totalmem } from 'node:os'
import { join } from 'node:path'

const PROFILES = ['mobile', 'desktop']
const CATEGORIES = ['performance', 'accessibility', 'best-practices', 'seo']
const TARGETS = { performance: 90, accessibility: 95, 'best-practices': 95, seo: 90 }
const METRICS = [
  ['largest-contentful-paint', 'LCP', (value) => `${(value / 1000).toFixed(2)} s`],
  ['cumulative-layout-shift', 'CLS', (value) => value.toFixed(3)],
  ['total-blocking-time', 'TBT', (value) => `${Math.round(value)} ms`],
]

const median = (values) => {
  const sorted = [...values].sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2
}

const readJson = (path) => JSON.parse(readFileSync(path, 'utf8'))

const lines = ['# Resultados Lighthouse', '', `Gerado em ${new Date().toISOString()} por \`lighthouse/summarize.mjs\`.`, '']
let environment

for (const profile of PROFILES) {
  const manifestPath = join('lighthouse', 'reports', profile, 'manifest.json')
  if (!existsSync(manifestPath)) continue
  const runsByUrl = Map.groupBy(readJson(manifestPath), (run) => new URL(run.url).pathname)
  lines.push(`## Perfil ${profile}`, '')
  lines.push(`| Página | Execuções | ${CATEGORIES.join(' | ')} | ${METRICS.map(([, label]) => label).join(' | ')} | Relatório |`)
  lines.push(`| --- | ---: | ${CATEGORIES.map(() => '---:').join(' | ')} | ${METRICS.map(() => '---:').join(' | ')} | --- |`)
  for (const [pathname, runs] of runsByUrl) {
    const reports = runs.map((run) => readJson(run.jsonPath))
    environment ??= reports[0]
    const scores = CATEGORIES.map((category) => {
      const score = Math.round(median(runs.map((run) => run.summary[category] * 100)))
      return score < TARGETS[category] ? `**${score}**` : `${score}`
    })
    const metrics = METRICS.map(([id, , format]) => format(median(reports.map((report) => report.audits[id].numericValue))))
    const representative = runs.find((run) => run.isRepresentativeRun) ?? runs[0]
    lines.push(`| \`${pathname}\` | ${runs.length} | ${scores.join(' | ')} | ${metrics.join(' | ')} | ${representative.htmlPath.replaceAll('\\', '/')} |`)
  }
  lines.push('')
}

if (environment) {
  const { throttling } = environment.configSettings
  lines.push('## Ambiente', '')
  lines.push(`- Lighthouse ${environment.lighthouseVersion}`)
  lines.push(`- Navegador: ${environment.environment.hostUserAgent}`)
  lines.push(`- Node ${process.version}, ${platform()} ${release()} (${arch()}), ${cpus().length} CPUs, ${Math.round(totalmem() / 1024 ** 3)} GB RAM`)
  lines.push(`- Benchmark index: ${environment.environment.benchmarkIndex}`)
  lines.push(`- Throttling (último perfil lido): RTT ${throttling.rttMs} ms, ${throttling.throughputKbps} Kbps, CPU ${throttling.cpuSlowdownMultiplier}x`)
  lines.push('- Valores em negrito estão abaixo da meta. Medianas de 3 execuções por página e perfil.')
}

writeFileSync(join('lighthouse', 'RESULTS.md'), `${lines.join('\n')}\n`)
console.log(lines.join('\n'))
