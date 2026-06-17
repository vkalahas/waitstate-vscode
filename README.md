# Waitstate Ad Status

A subtle status bar sponsor line for VS Code and Cursor. Waitstate surfaces sponsored developer tools in your editor without slowing startup or interrupting your workflow.

## Getting started

1. Sign up at [waitstate.dev](https://waitstate.dev) and copy your publisher ID.
2. Install the extension (or run from source below).
3. Add your publisher ID to settings:

```json
{
  "waitstate.publisherId": "your-publisher-id"
}
```

When an ad is available, a sponsored message appears in the bottom-right status bar. Click it to open the sponsor link.

## Settings

| Setting | Description |
|---------|-------------|
| `waitstate.publisherId` | Required. Your Waitstate publisher ID. |
| `waitstate.apiBaseUrl` | Waitstate API base URL. Use the default unless directed otherwise by Waitstate support. |

## Privacy

Set `DO_NOT_TRACK=1` in your environment to disable all network activity from this extension.

## Development

```bash
npm install
npm run compile
```

Open this folder in VS Code or Cursor and press **F5** to launch an Extension Development Host.

### Smoke test

With a Waitstate API endpoint reachable at your configured `waitstate.apiBaseUrl`:

```bash
node scripts/mock-integration.mjs
```

## Build

```bash
npm run compile
npm run watch
```
