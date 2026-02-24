# Transkit - Translation Tool

## Project Overview

A lightweight translation tool for Chinese-English translation, supporting both CLI and Chrome extension.

## Technology Stack

- **Language**: TypeScript
- **Package Manager**: pnpm (workspaces)
- **API**: Microsoft Translator API
- **Architecture**: Monorepo with shared core module

## Project Structure

```
transkit/
├── packages/
│   ├── core/                 # Core translation logic (shared)
│   │   ├── src/
│   │   │   ├── translator.ts        # Microsoft Translator API wrapper
│   │   │   ├── language-detector.ts # Auto language detection
│   │   │   ├── config.ts            # Configuration management
│   │   │   ├── cache.ts             # Local translation cache (~/.config/transkit/cache.json)
│   │   │   └── types.ts             # Shared types
│   │   └── package.json
│   ├── cli/                  # Command-line tool
│   │   ├── src/
│   │   │   └── index.ts             # CLI entry point
│   │   └── package.json
│   └── chrome-extension/     # Chrome extension
│       ├── src/
│       │   ├── background.ts        # Service worker
│       │   ├── popup.html           # Popup UI
│       │   ├── popup.ts             # Popup logic
│       │   └── content.ts           # Content script (optional)
│       ├── manifest.json
│       └── package.json
└── package.json              # Root package with workspaces
```

## Current Status

- ✅ Project initialized
- ✅ Git repository created
- ✅ Environment variables configured
- ✅ Core translation module implemented
- ✅ CLI tool implemented (global commands: `transkit`, `f`)
- ✅ Translation cache implemented (`~/.config/transkit/cache.json`)
- ✅ `f --setup` interactive setup command
- ✅ Chrome extension (selection bubble + popup API key setup)

## CLI Features

- Auto language detection (Chinese ↔ English)
- `--from` / `--to` flags for explicit language override
- stdin support (`echo "text" | f`)
- `-v / --verbose` flag: shows `[from → to]` language direction
- `--no-cache` flag: bypass local cache
- `--setup` flag: interactive API key / region setup (replaces ambiguous `config` subcommand)
- `.env` lookup order: cwd → `~/.config/transkit/.env` → source tree root

## API Configuration

- **Endpoint**: https://api.cognitive.microsofttranslator.com/
- **API Key**: Configured via `f config` or `.env`
- **API Version**: 3.0

## Next Steps

1. ~~Discuss detailed requirements~~ ✅
2. ~~Set up monorepo structure~~ ✅
3. ~~Implement core translation module~~ ✅
4. ~~Build CLI tool~~ ✅
5. ~~Build Chrome extension~~ ✅

## Notes

- API Key is stored in `.env` (not committed to git)
- Using monorepo for code reusability
- Core logic shared between CLI and extension
