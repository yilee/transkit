# Transkit

A lightweight Chinese ↔ English translation tool powered by Microsoft Translator. Supports CLI and Chrome extension (coming soon).

## Prerequisites

- Node.js >= 16
- pnpm >= 8 (`npm install -g pnpm`)
- A [Microsoft Translator](https://azure.microsoft.com/en-us/products/ai-services/translator) API key

## Installation

### 1. Clone and install dependencies

```bash
git clone https://github.com/yilee/transkit.git
cd transkit
pnpm install
```

### 2. Build

```bash
pnpm build
```

### 3. Register global command

```bash
cd packages/cli
npm link
```

This registers two global commands: `transkit` and the shorthand `f`.

### 4. Configure API credentials

Run the interactive setup:

```bash
f config
```

This saves your API key and region to `~/.config/transkit/.env`, which is loaded automatically on every invocation regardless of your current directory.

Alternatively, copy `.env.example` to `.env` in the project root and fill in the values manually:

```
TRANSLATOR_API_KEY=<your-api-key>
TRANSLATOR_ENDPOINT=https://api.cognitive.microsofttranslator.com/
TRANSLATOR_REGION=<your-region>   # e.g. eastasia, eastus
```

**Config lookup order** (first found wins):
1. Environment variables already set in the shell
2. `.env` in current working directory
3. `~/.config/transkit/.env` (user-level global config)

## Usage

### Basic translation

Language is auto-detected — just pass the text:

```bash
f "Hello, world"        # → 你好，世界
f 你好世界               # → Hello world
echo "Good morning" | f # → 早上好  (stdin supported)
```

### Options

```bash
f "Good morning" --to zh-Hans      # specify target language
f "早上好" --to en                  # specify target language
f "Hello" --from en --to zh-Hans   # specify both languages
f "Hello" -v                       # verbose: show [en → zh-Hans]
f "Hello" --no-cache               # skip cache, always call API
f --help                           # show usage
```

Supported language codes: `en`, `zh-Hans`, `zh-Hant`

### Interactive config

```bash
f config
```

Prompts for API Key, Region, and Endpoint. Press Enter to keep existing values. Saves to `~/.config/transkit/.env`.

### Translation cache

Results are cached in `~/.config/transkit/cache.json` (up to 1000 entries). Repeated translations return instantly without an API call. Use `-v` to see whether a result came from cache:

```bash
f "Hello" -v   # first call:  [en → zh-Hans]
f "Hello" -v   # second call: [en → zh-Hans] (cached)
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
│   │       ├── cache.ts             # Local translation cache
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
