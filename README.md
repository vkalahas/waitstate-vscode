# Waitstate Ad Status

A subtle status bar sponsor line for VS Code and Cursor. Waitstate surfaces sponsored developer tools in your editor without slowing startup or interrupting your workflow.

## Getting started

1. Sign up at [waitstate.dev](https://waitstate.dev) and copy your publisher ID.
2. Install the extension (or run from source below).
3. Run **Waitstate: Set Publisher ID** from the Command Palette (`Cmd+Shift+P` / `Ctrl+Shift+P`) and paste your publisher ID.

When an ad is available, a sponsored message appears in the bottom-right status bar. Click it to open the sponsor link.

Alternatively, set `WAITSTATE_PUBLISHER_ID` in your environment (useful for CI or headless setups).

After setting your publisher ID for the first time, **reload the window** (`Developer: Reload Window`) so the extension can fetch an ad on startup.

## Configuration

### Settings

| Setting | Default | Description |
|---------|---------|-------------|
| `waitstate.apiBaseUrl` | `http://127.0.0.1:8787` | Waitstate API base URL. Production endpoints must use HTTPS; HTTP is only allowed for `localhost` / `127.0.0.1`. |
| `waitstate.publisherId` | *(empty)* | **Deprecated.** Use the **Waitstate: Set Publisher ID** command instead. If still set, the value is migrated once into Secret Storage. |

### Environment variables

| Variable | Description |
|----------|-------------|
| `WAITSTATE_PUBLISHER_ID` | Publisher ID (alternative to the command; checked after Secret Storage) |
| `WAITSTATE_API_BASE_URL` | API base URL (overrides `waitstate.apiBaseUrl`) |
| `DO_NOT_TRACK=1` | Disables all network activity from this extension |

### Publisher ID resolution order

1. VS Code Secret Storage (set via **Waitstate: Set Publisher ID**)
2. `WAITSTATE_PUBLISHER_ID` environment variable
3. Legacy `waitstate.publisherId` setting (migrated to Secret Storage on first use)

### Commands

| Command | Description |
|---------|-------------|
| **Waitstate: Set Publisher ID** | Save your publisher ID to VS Code Secret Storage (password-masked prompt) |

## Privacy & security

This extension is designed to collect as little as possible and never touch your code or workspace.

### What we access

- **Nothing from your project.** The extension does not read files, editor content, git state, or workspace metadata.
- **No third-party analytics.** There are no PostHog, Segment, or similar SDKs.

### What we send (only when configured)

When a publisher ID is set and `DO_NOT_TRACK` is not enabled, the extension contacts your configured Waitstate API:

| Request | Data sent |
|---------|-----------|
| `GET /fetch-ad` | Publisher ID (Bearer token) |
| `POST /impression` | Publisher ID (Bearer + body), campaign ID, ad ID, timestamp |
| `POST /click` | Same as impression, when you click the status bar ad |

Sponsor links open in your **system browser** via HTTPS only. Non-HTTPS URLs are blocked.

### How credentials are stored

Your publisher ID is stored in **VS Code Secret Storage** (encrypted by the editor), not in plaintext settings. The legacy `waitstate.publisherId` setting is migrated to Secret Storage on first use.

### Opt out

Set `DO_NOT_TRACK=1` in your environment to disable **all** network activity from this extension. See [Environment variables](#environment-variables) above.

### What we do not do

- No telemetry to third parties
- No local persistence of ad content or browsing history
- No filesystem access
- No logging of your publisher ID or sponsor URLs

For questions about server-side data handling, see [waitstate.dev](https://waitstate.dev).

## Development

```bash
npm install
npm run compile
```

Open this folder in VS Code or Cursor and press **F5** to launch an Extension Development Host. The launch config sets `WAITSTATE_PUBLISHER_ID` and `WAITSTATE_API_BASE_URL` for local testing.

### Smoke test

With a Waitstate API endpoint reachable (defaults to `http://127.0.0.1:8787`):

```bash
node tests/mock-integration.mjs
# or against a custom base URL:
node tests/mock-integration.mjs https://api.example.com
```

## Build

```bash
npm run compile
npm run watch
```
