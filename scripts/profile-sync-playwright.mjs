import fs from 'node:fs/promises'
import path from 'node:path'
import { createInterface } from 'node:readline/promises'
import { stdin as input, stdout as output } from 'node:process'
import { fileURLToPath } from 'node:url'

async function loadPlaywright() {
  try {
    return await import('playwright')
  } catch {
    throw new Error(
      'Playwright nao esta instalado. Rode `npm install` ou `npm install -D playwright` dentro de professional-hub antes de executar `npm run profile:sync`.',
    )
  }
}

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const payloadPath = path.join(rootDir, 'public', 'data', 'profile-sync-payload.json')
const artifactsPath = path.join(rootDir, 'public', 'data')

function timestampSlug() {
  return new Date().toISOString().replace(/[:.]/g, '-')
}

async function readPayload() {
  const raw = await fs.readFile(payloadPath, 'utf8')
  return JSON.parse(raw)
}

async function ensureDir(dirPath) {
  await fs.mkdir(dirPath, { recursive: true })
}

async function writeReport(reportPath, lines) {
  await fs.writeFile(reportPath, `${lines.join('\n')}\n`, 'utf8')
}

function buildReport({ payload, checkpointState, screenshotsDir, evidence }) {
  const now = new Date().toISOString()
  return [
    '# Profile Sync Playwright Report',
    '',
    `- Generated at (UTC): ${now}`,
    `- Name: ${payload.name}`,
    `- GitHub: ${payload.githubUrl}`,
    `- LinkedIn: ${payload.linkedinUrl}`,
    `- Checkpoint result: ${checkpointState}`,
    `- Screenshots directory: ${screenshotsDir}`,
    '',
    '## Manual checkpoints',
    '',
    '- GitHub profile opened and reviewed',
    '- LinkedIn profile opened and reviewed',
    '- Human confirmation collected before finish',
    '',
    '## Notes',
    '',
    '- This flow is semi-automated by design.',
    '- No external submission is performed by the script.',
    '',
    '## Evidence',
    '',
    ...evidence,
  ]
}

async function pauseForHuman(rl, message) {
  await rl.question(`\n${message}\nPressione Enter para continuar...`)
}

async function capturePage(page, screenshotPath, label) {
  await page.screenshot({ path: screenshotPath, fullPage: true })
  return `- ${label}: ${screenshotPath}`
}

async function run() {
  const payload = await readPayload()
  const { chromium } = await loadPlaywright()

  const sessionId = timestampSlug()
  const sessionDir = path.join(artifactsPath, 'profile-sync-runs', sessionId)
  const screenshotsDir = path.join(sessionDir, 'screenshots')
  await ensureDir(screenshotsDir)

  const rl = createInterface({ input, output })
  const browser = await chromium.launch({ headless: false })
  const context = await browser.newContext({ viewport: { width: 1440, height: 1440 } })

  const evidence = []
  let checkpointState = 'pending'

  try {
    const githubPage = await context.newPage()
    await githubPage.goto(payload.githubUrl, { waitUntil: 'domcontentloaded' })
    await pauseForHuman(
      rl,
      'GitHub aberto. Faça o ajuste manual necessario com base no payload e depois confirme aqui.',
    )
    evidence.push(
      await capturePage(githubPage, path.join(screenshotsDir, 'github-profile.png'), 'GitHub screenshot'),
    )

    const linkedinPage = await context.newPage()
    await linkedinPage.goto(payload.linkedinUrl, { waitUntil: 'domcontentloaded' })
    await pauseForHuman(
      rl,
      'LinkedIn aberto. Faça o ajuste manual necessario com base no payload e depois confirme aqui.',
    )
    evidence.push(
      await capturePage(linkedinPage, path.join(screenshotsDir, 'linkedin-profile.png'), 'LinkedIn screenshot'),
    )

    const finalAnswer = await rl.question('\nCheckpoint humano concluido? (y/n): ')
    checkpointState = finalAnswer.trim().toLowerCase().startsWith('y') ? 'approved' : 'needs-adjustments'
  } finally {
    await writeReport(
      path.join(sessionDir, 'profile-sync-report.md'),
      buildReport({ payload, checkpointState, screenshotsDir, evidence }),
    )
    await rl.close()
    await browser.close()
  }
}

await run()
