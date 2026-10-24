# Moonrail Codex Working Rules

- Product mission: Moonrail is a professional-quality, presentable roguelite deckbuilder with persistent collection, gacha end-of-run progression, hidden lore, character-specific arcs, readable UI, and a coherent fantasy/Touhou-adjacent identity. Every change should protect or improve that product direction.
- Before changing files, re-orient on the current user request, the product mission, and the relevant existing systems. Do not treat an isolated ticket as permission to forget the broader game.
- The user's workstation is the priority. Keep CPU and process pressure low by default.
- Prefer sequential checks over broad parallel test runs unless the user explicitly asks for maximum speed.
- Use the lightest validation that protects the change. Reserve full UI smoke with screenshots for visual delivery or high-risk layout work.
- Do not leave local servers, browsers, or background test processes running after a turn.
- Keep product-facing changes documented in `DOSSIER_PRODUIT_PRIVE_MOONRAIL.md`. Skip the bible only for purely internal, non-product-visible maintenance or tiny copy removals that do not change behavior, systems, lore, unlocks, UI structure, or player-facing rules.
- Version every project modification cleanly with git: inspect status first, commit the scoped change after validation, and push to `origin/main` when the pass is complete.
- End every modification pass with a concise handoff: what changed, what was validated, commit hash, and whether it was pushed.


## Contexte conversationnel ChatGPT / passation Codex

Lire aussi **`docs/CHATGPT_PROJECT_HISTORY.md`** pour les échanges et décisions retrouvés. Ce journal est explicitement partiel ; ne jamais présenter un résumé comme un verbatim. À chaque changement de projet, ajouter les nouveaux échanges pertinents avec rôles Utilisateur/Assistant, texte exact et horodatages uniquement lorsqu'ils sont disponibles ; sinon noter la lacune. Préserver l'ensemble des règles et documents existants de ce dépôt et ne publier aucun secret.
