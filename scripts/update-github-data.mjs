import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'

const username = process.env.GITHUB_USERNAME || 'datacrash'
const token = process.env.GITHUB_TOKEN
const outFile = process.env.GITHUB_METRICS_FILE || path.resolve('public/data/github-metrics.json')

function buildHeaders() {
  const headers = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'professional-hub-data-refresh',
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  return headers
}

async function fetchRepos() {
  const response = await fetch(
    `https://api.github.com/users/${username}/repos?per_page=100&type=owner&sort=updated`,
    { headers: buildHeaders() },
  )

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`GitHub API error ${response.status}: ${body}`)
  }

  return response.json()
}

function toDate(value) {
  return value ? new Date(value).getTime() : 0
}

function aggregateMetrics(repos) {
  const publicRepos = repos.filter((repo) => !repo.private)
  const totalStars = publicRepos.reduce((sum, repo) => sum + (repo.stargazers_count || 0), 0)
  const totalForks = publicRepos.reduce((sum, repo) => sum + (repo.forks_count || 0), 0)
  const openIssues = publicRepos.reduce((sum, repo) => sum + (repo.open_issues_count || 0), 0)

  const languages = publicRepos.reduce((acc, repo) => {
    const key = repo.language || 'Other'
    acc[key] = (acc[key] || 0) + 1
    return acc
  }, {})

  const topRepos = [...publicRepos]
    .sort((a, b) => {
      if ((b.stargazers_count || 0) !== (a.stargazers_count || 0)) {
        return (b.stargazers_count || 0) - (a.stargazers_count || 0)
      }

      return toDate(b.updated_at) - toDate(a.updated_at)
    })
    .slice(0, 8)
    .map((repo) => ({
      name: repo.name,
      description: repo.description,
      url: repo.html_url,
      stars: repo.stargazers_count || 0,
      forks: repo.forks_count || 0,
      language: repo.language || 'Other',
      updatedAt: repo.updated_at,
    }))

  const languagesByVolume = Object.entries(languages)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)

  return {
    profile: {
      username,
      profileUrl: `https://github.com/${username}`,
      fetchedAt: new Date().toISOString(),
    },
    totals: {
      repositories: publicRepos.length,
      stars: totalStars,
      forks: totalForks,
      openIssues,
    },
    languages: languagesByVolume,
    topRepositories: topRepos,
  }
}

async function main() {
  const repos = await fetchRepos()
  const metrics = aggregateMetrics(repos)

  await mkdir(path.dirname(outFile), { recursive: true })
  await writeFile(outFile, `${JSON.stringify(metrics, null, 2)}\n`, 'utf8')

  console.log(`GitHub metrics updated: ${outFile}`)
}

try {
  await main()
} catch (error) {
  console.error(error)
  process.exit(1)
}
