import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const payloadPath = path.join(rootDir, 'public', 'data', 'profile-sync-payload.json')
const readmeSnippetPath = path.join(rootDir, 'public', 'data', 'github-profile-readme-snippet.md')
const reviewTemplatePath = path.join(rootDir, 'public', 'data', 'profile-sync-review-template.md')

function normalizePublicPath(inputPath) {
  return inputPath.replace(/^\/+/, '')
}

function buildReadmeSnippet(payload) {
  const cvPt = normalizePublicPath(payload.cvDownloads.ptBr)
  const cvEn = normalizePublicPath(payload.cvDownloads.en)
  const roleLines = payload.targetRoles.en.map((role) => `- ${role}`).join('\n')

  return `# ${payload.name}\n\n${payload.headlineEn}\n\n- Location: ${payload.location}\n- Current company: ${payload.currentCompany}\n- LinkedIn: ${payload.linkedinUrl}\n- Professional Hub: ${payload.githubUrl}\n\n## Career Focus\n\n${roleLines}\n\n## Quick Links\n\n- CV (PT-BR): ./${cvPt}\n- CV (EN): ./${cvEn}\n- Dashboard: https://datacrash.github.io/GitHub-Dashboard/\n\n## Notes\n\n- This profile is maintained with a forward-only and human-checkpoint process.\n`
}

function buildReviewTemplate(payload) {
  const now = new Date().toISOString()
  const expectedGithubBio = `${payload.headlineEn} | ${payload.location} | ${payload.currentCompany}`

  return `# Profile Sync Review Log\n\n## Session Metadata\n\n- Generated at (UTC): ${now}\n- Name: ${payload.name}\n- Human checkpoint required: ${payload.notes.humanCheckpointRequired ? 'yes' : 'no'}\n\n## GitHub Review\n\n- [ ] Public name reviewed\n- [ ] Bio/headline updated\n- [ ] Location updated\n- [ ] Website points to published frontpage\n- [ ] Profile README links validated\n\n## LinkedIn Review\n\n- [ ] Headline reviewed\n- [ ] Location reviewed\n- [ ] Current company reviewed\n- [ ] About summary aligned with hub\n- [ ] External links validated\n\n## CV and Hub Validation\n\n- [ ] CV PT-BR link works\n- [ ] CV EN link works\n- [ ] Frontpage opens\n- [ ] Dashboard opens\n\n## Expected vs Observed\n\n- [ ] GitHub Bio matches expected\nExpected: ${expectedGithubBio}\nObserved:\n\n- [ ] GitHub Location matches expected\nExpected: ${payload.location}\nObserved:\n\n- [ ] LinkedIn Headline matches expected\nExpected: ${payload.headlineEn}\nObserved:\n\n- [ ] LinkedIn Location matches expected\nExpected: ${payload.location}\nObserved:\n\n- [ ] LinkedIn Company matches expected\nExpected: ${payload.currentCompany}\nObserved:\n\n## Approval\n\n- Reviewer:\n- Decision: approved / needs-adjustments\n- Notes:\n`
}

async function run() {
  const payloadRaw = await fs.readFile(payloadPath, 'utf8')
  const payload = JSON.parse(payloadRaw)

  const readmeSnippet = buildReadmeSnippet(payload)
  const reviewTemplate = buildReviewTemplate(payload)

  await fs.writeFile(readmeSnippetPath, readmeSnippet, 'utf8')
  await fs.writeFile(reviewTemplatePath, reviewTemplate, 'utf8')

  console.log('Profile sync artifacts generated:')
  console.log(`- ${path.relative(rootDir, readmeSnippetPath)}`)
  console.log(`- ${path.relative(rootDir, reviewTemplatePath)}`)
}

await run()
