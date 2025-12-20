# V2 Branch Setup

## Overview
The `v2` branch is a separate version of the game, allowing experimentation while keeping the original (`master`) unchanged.

## Branch Structure
- **`master`**: Original version → deployed to `/arrws/`
- **`v2`**: New version → configured for `/arrws/v2/`

## Configuration
- **Base Path**: `/arrws/v2/` (set in `vite.config.js`)
- **Workflow**: `.github/workflows/deploy-v2.yml` (triggers on `v2` branch pushes)
- **Cache**: `arrws-v2-cache` (separate from master)

## Deployment Options

### Option A: Separate GitHub Pages Site (Recommended)
1. Create a separate repository (e.g., `arrws-v2`)
2. Push `v2` branch to that repo
3. Enable GitHub Pages on that repo
4. Access at: `https://ozlphrt.github.io/arrws-v2/`

### Option B: Manual Merge to Master
1. Build v2: `npm run build`
2. Copy `dist/` contents to `v2/` folder in master branch
3. Commit and push to master
4. Access at: `https://ozlphrt.github.io/arrws/v2/`

### Option C: Automated Merge Workflow
Create a workflow that:
1. Builds v2 on push
2. Checks out master
3. Copies v2 build to `v2/` subdirectory
4. Commits and pushes to master

## Current Status
- ✅ Branch created: `v2`
- ✅ Base path configured: `/arrws/v2/`
- ✅ Separate workflow created: `deploy-v2.yml`
- ⚠️ Deployment strategy: Choose Option A, B, or C above

## Development
```bash
# Switch to v2
git checkout v2

# Make changes, then commit
git add .
git commit -m "feat(v2): ..."

# Push to trigger workflow
git push origin v2
```

## Switching Between Versions
```bash
# Work on original
git checkout master

# Work on v2
git checkout v2
```

