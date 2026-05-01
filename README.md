# project-memory

`project-memory` is a reusable Node.js CLI that builds persistent, structured memory for any codebase so LLM agents do not need to re-analyze everything on each task.

## What it generates

- `PROJECT_MAP.md`
- `FILE_INDEX.md`
- `CHANGELOG_AI.md`
- `.project-memory/state.json` (incremental cache)

## Features

- Recursive scanning with ignore rules and `.gitignore` support
- Multi-language support (JavaScript, TypeScript, Python)
- Incremental updates using per-file SHA-256 hashes
- Dependency graph and entrypoint inference
- Compact file summaries for token efficiency
- JS/TS parsing mode:
  - **AST mode** when Babel packages are available
  - **Fallback regex mode** when they are not available

## Install / Run

```bash
npm install
node src/cli.js --root /path/to/target/project
```

or

```bash
npx project-memory --root /path/to/target/project
```

## CLI options

- `--root <path>`: target directory
- `--verbose`: print changed files that were re-analyzed
- `--with-ai`: reserved extension flag

## Project structure

```text
project-memory/
  src/
    cli.js
    index.js
    scanner.js
    analyzer.js
    dependencyGraph.js
    summarizer.js
    state.js
    output/writers.js
    parsers/javascript.js
    parsers/python.js
    utils/hash.js
  package.json
  README.md
```

## Notes

If your environment blocks npm registry access, the tool still runs for many projects using regex JS parsing fallback. Installing optional Babel dependencies improves accuracy.
