# Phase 4A Preview handoff

This handoff deploys the uncommitted Phase 4A working tree to a Vercel Preview. It does not create the final Phase 4A commit and must not use `--prod`.

## Required Preview-only variables

Configure these in the Vercel project with **Preview** selected as the only environment:

```text
LIVING_ORACLE_V3_ENABLED=true
JESTER_3D_V4A_ENABLED=true
```

Do not edit the Production values. `JESTER_3D_V4A_ENABLED` remains `false` in the repository defaults.

## Apply the overlay

From PowerShell, replace the example paths only if the files are stored elsewhere:

```powershell
$repo = "C:\Users\adoni\Downloads\qoracle-mvp\qoracle"
$overlay = "C:\Users\adoni\Downloads\qrystal-balls-phase4a-preview-overlay.zip"

Set-Location $repo
git switch phase4a-jester-rig
git status --short --branch
git rev-parse HEAD
```

Before extraction, the branch must be `phase4a-jester-rig`, HEAD must be `921294b`, and the working tree must be clean. Then apply the overlay:

```powershell
Expand-Archive -Path $overlay -DestinationPath $repo -Force
Set-Location $repo
npm ci
npm test
npm run lint
npm run build
git diff --check
git status --short
```

Do not commit these changes yet.

## Configure and deploy Preview

In the Vercel dashboard, open the production project's **Settings → Environment Variables**. Add or update the two variables above with **Preview only** selected. Leave Production unselected.

Deploy the current working tree with the Vercel CLI:

```powershell
Set-Location $repo
npx vercel@latest pull --yes --environment=preview
npx vercel@latest --yes
```

The second command creates a Preview deployment. Do not add `--prod`. Copy the URL printed by the command. The direct Jester route is that URL plus `/oracle?theme=jester`.

## Jazz status

The Jazz source derivative is packaged for later review, but the manifest keeps it unapproved and the current runtime does not load or play it.
