# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Skynet API Builder is a React + TypeScript portal for browsing Skynet network infrastructure API endpoints, filling parameters, and generating YAML/JSON request bodies. It has two modes:
- **Endpoint Builder**: Browse individual API endpoints, fill required/optional parameters, generate YAML
- **Workflows Builder**: Execute multi-step API workflows with pre-configured request sequences

## Commands

```bash
npm run dev          # Start Vite dev server (served from remote at 10.58.108.24)
npm run build        # Type-check (tsc -b) and produce production bundle
npm test             # Run Vitest suite in watch mode
npm test -- --run    # Run tests once without watch mode
npm run build-spec   # Regenerate skynetSpec.json from Skynet docs (only when docs change)
```

To run a single test file:
```bash
npm test -- src/utils/helpers.test.ts --run
```

## Deployment

This app is served from a remote Alma Linux server at `10.58.108.24` (user: victor). When updating the codebase locally, sync changes to the server:

```bash
./sync-to-server.sh
```

Or manually:
```bash
sshpass -p 'Nyc4u2me' rsync -avz --exclude='node_modules' --exclude='dist' --exclude='.git' \
  -e 'ssh -o StrictHostKeyChecking=no' \
  /Users/DT232381/code/skynet_api_builder_with_workflows victor@10.58.108.24:~/
```

**IMPORTANT**: Always sync after making local changes, then restart the app (see pm2 commands below).

The server requires Node.js 20+ for Vite 7. Access via **https://skynet-api-builder.ssnc-corp.lab**

### pm2 Process Management

The app runs as a pm2 process and auto-starts on boot. Run these commands as root on the server:

```bash
pm2 status                      # Check status
pm2 logs skynet-api-builder     # View logs
pm2 stop skynet-api-builder && sleep 3 && pm2 start skynet-api-builder  # Restart app (after syncing changes)
pm2 stop skynet-api-builder     # Stop app
pm2 delete skynet-api-builder   # Remove from pm2
```

**IMPORTANT**: Do NOT use `pm2 restart` - it starts the new process before killing the old one, causing port conflicts. Always use stop + sleep + start.

### SSL/HTTPS

HTTPS is enabled using mkcert certificates. Port 443 redirects to 5173 via iptables.
- Certificates: `skynet-api-builder.ssnc-corp.lab+3.pem` and `skynet-api-builder.ssnc-corp.lab+3-key.pem`
- First-time visitors must accept the browser security warning (traffic is still encrypted)

## Architecture

### Data Flow
1. `scripts/build-spec.js` parses Markdown API docs into `src/data/skynetSpec.json` (~200+ endpoints)
2. `useSkynet` hook loads spec, handles search/filtering with debouncing, manages form state
3. `buildWorkflowSnippets` in `src/utils/workflows.ts` generates API call snippets for workflow steps
4. YAML output uses js-yaml with custom `fixEndpointYaml` to handle long paths

### Key Files
- `src/hooks/useSkynet.ts` - Main state management for Endpoint Builder (search, selection, form, YAML generation)
- `src/hooks/useDebounce.ts` - Debounce hook for search optimization
- `src/hooks/useCopyToClipboard.ts` - Optimized clipboard with cached textarea fallback
- `src/utils/workflows.ts` - Workflow snippet generation, input extraction, placeholder replacement
- `src/utils/helpers.ts` - Schema building, payload cleaning, YAML fixes
- `src/data/workflows.ts` - Hardcoded workflow definitions (24 workflows)
- `src/components/Sidebar.tsx` - Virtual scrolling endpoint list (@tanstack/react-virtual)
- `src/components/WorkflowView.tsx` - Lazy-loaded workflow mode UI

### Performance Optimizations
- Virtual scrolling in Sidebar (only renders visible endpoints)
- Debounced search (150ms) and workflow inputs (200ms)
- Lazy-loaded WorkflowView component (code-split chunk)
- Memoized components and callbacks throughout
- Cached textarea for clipboard fallback

### Special Business Logic
- `sdn_version` defaults to 2 (SDN2) unless doc specifies otherwise
- For `/api/v4/sdn/arista/switch/sync_config`: `device_id` and `hostname` are mutually exclusive - if both provided, `device_id` takes priority

## Git Workflow

Always push to both remotes:
```bash
git push github main && git push workflows main
```

Remotes:
- `github` → https://github.com/Vic563/skynet_api_builder.git
- `workflows` → git@code.ssnc.dev:dt232381/skynet-apibuilder-with-workflow.git

## Coding Conventions
- TypeScript strict mode; explicit types on exports
- Functional React components with hooks
- Component files: PascalCase (e.g., `EndpointForm.tsx`)
- Hook files: `useSomething.ts`
- Tests alongside code: `*.test.ts` / `*.test.tsx`
- 2-space indent, single quotes, semicolons
