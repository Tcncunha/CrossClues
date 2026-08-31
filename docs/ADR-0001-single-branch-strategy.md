# ADR-0001: Estratégia de Branch Única (single branch strategy)

- **Status:** Aceito
- **Data:** 2026-08-31
- **Decisores:** MasterMind (DevOps), Debug (Code Reviewer), ZicaZica (QA)

## Decisão

Adotar `main` como **branch canônica única** para o repositório. Todo o trabalho
de desenvolvimento segue o fluxo:

- **Branch canônica / trunk:** `main`
- **Feature branches:** curtas e efêmeras criadas a partir de `main`
- **Integração:** via **squash merge** em PRs (histórico limpo, um commit por entrega)
- **Convenção de commits:** **Conventional Commits** (`feat:`, `fix:`, `chore:`,
  `docs:`, `refactor:`, etc.)
- **Config de push:** `git config remote.origin.push refs/heads/main:refs/heads/main`
  para garantir que o push local sempre vá para `main`.

A branch `master` foi **removida** (local e remota) e deixou de existir como
alternativa.

## Contexto

Havia uma **bifurcação de branches principais** concorrentes:

- `main` — usada como branch de trabalho local.
- `master` — branch default no remoto (GitHub).

Essa duplicidade causava **PRs `master → main` frequentes**, commits de merge
fantasma, confusão sobre qual branch era a fonte da verdade e poluição do
histórico (diversos `Merge pull request #N from Tcncunha/master`).

## Consequências

- **Positivas:**
  - Fonte da verdade única e inequívoca (`main`).
  - Histórico limpo e rastreável com squash merge + Conventional Commits.
  - Fim dos PRs `master → main` e dos merges fantasma.
  - Redução de ruído e de retrabalho ao sincronizar branches.
- **Negativas / custos:**
  - Exige disciplina da equipe para manter feature branches curtas e commits
    convencionais.
  - Qualquer integração que aponte para `master` (CI, hooks, docs) precisa ser
    atualizada para `main`.
- **Riscos:**
  - Baixo. A transição já foi concluída com `main` como default e `master`
    removida.

## Alternativas consideradas

- **Manter `main` e `master` sincronizadas:** rejeitada — perpetua o problema
  de bifurcação e dobra o esforço de manutenção.
- **Migrar para `master` como canônica:** rejeitada — `main` já era a branch
  ativa e a default do remoto.
