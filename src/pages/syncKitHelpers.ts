import type {
  ObservedProfileState,
  ProfileSyncPayload,
} from "../content/profileContent";

export type SyncKitComparisonRow = {
  label: string;
  expected: string;
  observed: string;
};

export type SyncKitReadiness = {
  total: number;
  ok: number;
  divergent: number;
  pending: number;
  evaluated: number;
  completion: number;
  readyForCheckpoint: boolean;
};

export type ExpectedProfileFields = {
  githubBio: string;
  githubLocation: string;
  linkedinHeadline: string;
  linkedinLocation: string;
  linkedinCompany: string;
};

export function getDiffStatus(expected: string, observedValue: string) {
  if (!observedValue.trim()) return "não avaliado";
  return expected.trim().toLowerCase() === observedValue.trim().toLowerCase()
    ? "ok"
    : "divergente";
}

export function getDiffStatusClasses(status: string) {
  if (status === "ok") {
    return "border-emerald-500/40 bg-emerald-500/10 text-emerald-300";
  }
  if (status === "divergente") {
    return "border-amber-500/40 bg-amber-500/10 text-amber-300";
  }
  return "border-border/70 bg-background/70 text-muted-foreground";
}

export function buildExpectedProfileFields(
  payload: ProfileSyncPayload | null,
): ExpectedProfileFields {
  return {
    githubBio: payload
      ? `${payload.headlineEn} | ${payload.location} | ${payload.currentCompany}`
      : "",
    githubLocation: payload?.location ?? "",
    linkedinHeadline: payload?.headlineEn ?? "",
    linkedinLocation: payload?.location ?? "",
    linkedinCompany: payload?.currentCompany ?? "",
  };
}

export function buildComparisonRows(
  expected: ExpectedProfileFields,
  observed: ObservedProfileState,
): Array<SyncKitComparisonRow> {
  return [
    {
      label: "GitHub Bio",
      expected: expected.githubBio,
      observed: observed.githubBio,
    },
    {
      label: "GitHub Location",
      expected: expected.githubLocation,
      observed: observed.githubLocation,
    },
    {
      label: "LinkedIn Headline",
      expected: expected.linkedinHeadline,
      observed: observed.linkedinHeadline,
    },
    {
      label: "LinkedIn Location",
      expected: expected.linkedinLocation,
      observed: observed.linkedinLocation,
    },
    {
      label: "LinkedIn Company",
      expected: expected.linkedinCompany,
      observed: observed.linkedinCompany,
    },
  ];
}

export function buildReadiness(
  comparisonRows: Array<SyncKitComparisonRow>,
): SyncKitReadiness {
  let ok = 0;
  let divergent = 0;
  let pending = 0;

  comparisonRows.forEach((row) => {
    const status = getDiffStatus(row.expected, row.observed);
    if (status === "ok") ok += 1;
    if (status === "divergente") divergent += 1;
    if (status === "não avaliado") pending += 1;
  });

  const total = comparisonRows.length;
  const evaluated = total - pending;
  const completion = total ? Math.round((evaluated / total) * 100) : 0;
  const readyForCheckpoint = pending === 0 && divergent === 0;

  return {
    total,
    ok,
    divergent,
    pending,
    evaluated,
    completion,
    readyForCheckpoint,
  };
}

export function buildActionableDiffs(
  comparisonRows: Array<SyncKitComparisonRow>,
) {
  const divergentRows = comparisonRows.filter(
    (row) => getDiffStatus(row.expected, row.observed) === "divergente",
  );
  const pendingRows = comparisonRows.filter(
    (row) => getDiffStatus(row.expected, row.observed) === "não avaliado",
  );

  return {
    divergentRows,
    pendingRows,
  };
}

export function buildSyncKitDiagnosticMarkdown({
  payload,
  readiness,
  comparisonRows,
}: Readonly<{
  payload: ProfileSyncPayload | null;
  readiness: SyncKitReadiness;
  comparisonRows: Array<SyncKitComparisonRow>;
}>) {
  const now = new Date().toISOString();
  const source = payload?.notes.usage ?? "Sync Kit local snapshot";

  const lines = [
    "# Sync Kit Diagnostic Report",
    "",
    `- Generated at (UTC): ${now}`,
    `- Source: ${source}`,
    `- Ready for checkpoint: ${readiness.readyForCheckpoint ? "yes" : "no"}`,
    `- Completion: ${readiness.completion}%`,
    "",
    "## Summary",
    "",
    `- Evaluated: ${readiness.evaluated}/${readiness.total}`,
    `- OK: ${readiness.ok}`,
    `- Divergent: ${readiness.divergent}`,
    `- Pending: ${readiness.pending}`,
    "",
    "## Expected vs Observed",
    "",
  ];

  comparisonRows.forEach((row) => {
    lines.push(
      `- ${row.label}`,
      `  - Expected: ${row.expected || "n/a"}`,
      `  - Observed: ${row.observed || "n/a"}`,
    );
  });

  lines.push(
    "",
    "## Decision",
    "",
    "- Reviewer:",
    "- Decision: approved / needs-adjustments",
    "- Notes:",
  );

  return `${lines.join("\n")}\n`;
}
