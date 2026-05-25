import { Lock } from "lucide-react";
import { useState, type ReactNode } from "react";

import { Button } from "../components/ui/button";
import { ownerAccessStorageKey, type Locale } from "../content/profileContent";

function hasOwnerAccess() {
  return localStorage.getItem(ownerAccessStorageKey) === "true";
}

export function OwnerAccessGate({
  locale,
  children,
}: Readonly<{
  locale: Locale;
  children: ReactNode;
}>) {
  const [username, setUsername] = useState("");
  const [isOwner, setIsOwner] = useState(() => hasOwnerAccess());

  const text =
    locale === "pt-BR"
      ? {
          restricted: "Área restrita",
          title: "Sync Kit visível apenas para o proprietário",
          body: "Para reduzir exposição operacional, esta seção fica oculta para visitantes. Faça a validação com seu usuário GitHub para liberar o painel localmente neste navegador.",
          quickValidation: "Validação rápida",
          githubUser: "Usuário GitHub",
          placeholder: "Digite datacrash",
          unlock: "Liberar acesso local",
          note: "Nota",
          noteBody:
            "Esta proteção é de visibilidade na interface (frontend). Para segurança forte, o ideal é mover o Sync Kit para backend autenticado (GitHub OAuth ou acesso privado no repositório).",
        }
      : {
          restricted: "Restricted area",
          title: "Sync Kit visible only to the owner",
          body: "To reduce operational exposure, this section is hidden for visitors. Validate with your GitHub user to unlock the panel locally in this browser.",
          quickValidation: "Quick validation",
          githubUser: "GitHub user",
          placeholder: "Type datacrash",
          unlock: "Unlock local access",
          note: "Note",
          noteBody:
            "This is a UI visibility protection (frontend). For stronger security, move Sync Kit to an authenticated backend (GitHub OAuth or private repository access).",
        };

  if (isOwner) {
    return <>{children}</>;
  }

  return (
    <section className="grid gap-4 md:grid-cols-2">
      <article className="md:col-span-2 rounded-2xl border border-border bg-card p-6">
        <div className="mb-3 inline-flex rounded-xl border border-border bg-background p-2 text-primary">
          <Lock className="h-5 w-5" />
        </div>
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
          {text.restricted}
        </p>
        <h2 className="mt-2 text-3xl">{text.title}</h2>
        <p className="mt-3 max-w-3xl text-muted-foreground">{text.body}</p>
      </article>

      <article className="rounded-2xl border border-border bg-card p-6">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
          {text.quickValidation}
        </p>
        <label className="mt-3 block text-sm">
          <span className="mb-1 block text-muted-foreground">
            {text.githubUser}
          </span>
          <input
            value={username}
            onChange={(event) => {
              setUsername(event.target.value);
            }}
            className="w-full rounded-lg border border-border bg-background px-3 py-2"
            placeholder={text.placeholder}
          />
        </label>
        <Button
          className="mt-3"
          onClick={() => {
            if (username.trim().toLowerCase() === "datacrash") {
              localStorage.setItem(ownerAccessStorageKey, "true");
              globalThis.dispatchEvent(new Event("hub-owner-access-changed"));
              setIsOwner(true);
            }
          }}
        >
          {text.unlock}
        </Button>
      </article>

      <article className="rounded-2xl border border-border bg-card p-6">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
          {text.note}
        </p>
        <p className="mt-3 text-sm text-muted-foreground">{text.noteBody}</p>
      </article>
    </section>
  );
}
