import { useEffect, useState } from "react";

import { baseUrl, type GitHubMetrics } from "../content/profileContent";

export function useGithubMetrics() {
  const [githubMetrics, setGithubMetrics] = useState<GitHubMetrics | null>(
    null,
  );

  useEffect(() => {
    let isMounted = true;

    async function loadMetrics() {
      try {
        const response = await fetch(`${baseUrl}data/github-metrics.json`, {
          cache: "no-store",
        });
        if (!response.ok) return;
        const data = (await response.json()) as GitHubMetrics;
        if (isMounted) {
          setGithubMetrics(data);
        }
      } catch {
        // Keep fallback UI when metrics file is unavailable.
      }
    }

    void loadMetrics();

    return () => {
      isMounted = false;
    };
  }, []);

  return githubMetrics;
}
