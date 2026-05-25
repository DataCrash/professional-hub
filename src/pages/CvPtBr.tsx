import { Download, ExternalLink } from "lucide-react";

import { MarkdownPreview } from "../components/common/MarkdownPreview";
import { Button } from "../components/ui/button";
import {
  cvSummaryPtBrMarkdown,
  fitRolesPt,
  profile,
  type TrackClickHandler,
  volunteerHighlightsPt,
} from "../content/profileContent";

export function CvPtBr({
  onTrackClick,
}: Readonly<{
  onTrackClick: TrackClickHandler;
}>) {
  return (
    <section className="grid gap-4 md:grid-cols-5">
      <article className="md:col-span-3 rounded-2xl border border-border bg-card p-6">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
          CV PT-BR
        </p>
        <h2 className="mt-2 text-3xl">Senior .NET Engineer</h2>
        <p className="mt-3 text-muted-foreground">
          Engenheiro de Software Sênior com foco em backend, modernização de
          plataformas e evolução de sistemas críticos em ambientes enterprise.
        </p>
        <div className="mt-5">
          <div className="flex flex-wrap gap-2">
            <Button asChild>
              <a
                href={profile.linkedin}
                target="_blank"
                rel="noreferrer"
                onClick={() => {
                  onTrackClick("/cv-ptbr", "open-linkedin");
                }}
              >
                LinkedIn <ExternalLink className="ml-1 h-4 w-4" />
              </a>
            </Button>
            <Button asChild variant="outline">
              <a
                href={profile.github}
                target="_blank"
                rel="noreferrer"
                onClick={() => {
                  onTrackClick("/cv-ptbr", "open-github");
                }}
              >
                GitHub <ExternalLink className="ml-1 h-4 w-4" />
              </a>
            </Button>
            <Button asChild>
              <a
                href={profile.cvPtBrDownload}
                download
                onClick={() => {
                  onTrackClick("/cv-ptbr", "download-cv-ptbr");
                }}
              >
                Baixar PDF PT-BR <Download className="ml-1 h-4 w-4" />
              </a>
            </Button>
          </div>
        </div>
      </article>
      <article className="md:col-span-2 rounded-2xl border border-border bg-card p-6">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
          Vagas com fit
        </p>
        <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
          {fitRolesPt.map((role) => (
            <li
              key={role}
              className="rounded-lg border border-border/70 bg-background/60 px-3 py-2"
            >
              {role}
            </li>
          ))}
        </ul>
      </article>

      <article className="md:col-span-5 rounded-2xl border border-border bg-card p-6">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
          Comportamento e liderança
        </p>
        <h3 className="mt-2 text-2xl font-semibold">Atuação voluntária</h3>
        <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
          {volunteerHighlightsPt.map((highlight) => (
            <li
              key={highlight}
              className="rounded-lg border border-border/70 bg-background/60 px-3 py-2"
            >
              {highlight}
            </li>
          ))}
        </ul>
      </article>

      <article className="md:col-span-5 rounded-2xl border border-border bg-card p-6">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
          Resumo em Markdown
        </p>
        <h3 className="mt-2 text-2xl font-semibold">
          Visão geral detalhada do CV PT-BR
        </h3>
        <div className="mt-4 rounded-xl border border-border/70 bg-background/55 p-4">
          <MarkdownPreview markdown={cvSummaryPtBrMarkdown} />
        </div>
      </article>
    </section>
  );
}
