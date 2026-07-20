# Moonrail Codex Working Rules

- The user's workstation is the priority. Keep CPU and process pressure low by default.
- Prefer sequential checks over broad parallel test runs unless the user explicitly asks for maximum speed.
- Use the lightest validation that protects the change. Reserve full UI smoke with screenshots for visual delivery or high-risk layout work.
- Do not leave local servers, browsers, or background test processes running after a turn.
- Keep product-facing changes documented in `DOSSIER_PRODUIT_PRIVE_MOONRAIL.md`.
- Version every project modification cleanly with git: inspect status first, commit the scoped change after validation, and push to `origin/main` when the pass is complete.
