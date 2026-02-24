# Transkit

A lightweight Chinese ↔ English translation tool powered by Microsoft Translator. Supports CLI and Chrome extension (coming soon).

## Prerequisites

- Node.js >= 16
- pnpm >= 8 (`npm install -g pnpm`)
- A [Microsoft Translator](https://azure.microsoft.com/en-us/products/ai-services/translator) API key

## Installation

### 1. Clone and install dependencies

```bash
git clone <repo-url>
cd transkit
pnpm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env`:

```
TRANSLATOR_API_KEY=<your-api-key>
TRANSLATOR_ENDPOINT=https://api.cognitive.microsofttranslator.com/
TRANSLATOR_REGION=<your-region>   # e.g. eastasia, eastus
```

### 3. Build

```bash
pnpm build
```

### 4. Register global command

```bash
cd packages/cli
npm link
```

This registers two global commands: `transkit` and the shorthand `f`.

## Usage

Language is auto-detected — just pass the text:

```bash
f "Hello, world"        # → 你好，世界
f "你好世界"             # → Hello world
```

Override source or target language with `--from` / `--to`:

```bash
f "Good morning" --to zh-Hans   # → 早上好
f "早上好" --to en               # → Good morning
```

Supported language codes: `en`, `zh-Hans`, `zh-Hant`

```bash
f --help   # show usage
```

## Project Structure

```
transkit/
├── packages/
│   ├── core/               # Translation logic shared across packages
│   │   └── src/
│   │       ├── translator.ts        # Microsoft Translator API wrapper
│   │       ├── language-detector.ts # Auto language detection
│   │       ├── config.ts            # Loads .env configuration
│   │       └── types.ts             # Shared types
│   ├── cli/                # Command-line tool (transkit / f)
│   │   └── src/
│   │       └── index.ts
│   └── chrome-extension/   # Chrome extension (coming soon)
├── .env.example
└── pnpm-workspace.yaml
```

## Development

```bash
pnpm build        # build all packages
pnpm dev          # watch mode for all packages
pnpm clean        # remove all dist/ folders
```

## License

MIT
