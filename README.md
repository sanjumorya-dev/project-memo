# project-memory

`project-memory` is a reusable Node.js CLI that builds persistent, structured memory for any codebase so LLM agents do not need to re-analyze everything on each task.

## What it generates

- `PROJECT_MAP.md`
  - Architecture overview
  - Inferred flow and entrypoints
  - Key module connectivity
- `FILE_INDEX.md`
  - File-by-file structural summaries
  - Functions, classes, imports/exports
  - Call relationships (calls/called-by)
- `CHANGELOG_AI.md`
  - Append-only structural change log

It also writes cached state to `.project-memory/state.json` for incremental runs.

## Features

- Recursive scanning with ignore rules (`node_modules`, `.git`, build outputs, etc.)
- Multi-language support (JavaScript, TypeScript, Python)
- AST-based parsing for JS/TS using Babel
- Lightweight Python structural parser
- Dependency graph construction from import relationships
- Incremental updates via per-file content hash
- Efficient summaries designed to minimize token usage

## Install / Run

### Local usage

```bash
npm install
node src/cli.js --root /path/to/target/project
```

### As CLI (same repo)

```bash
npm install
npx project-memory --root /path/to/target/project
```

## CLI options

- `--root <path>`: target directory (default: current directory)
- `--verbose`: print analyzed changed files
- `--with-ai`: reserved hook for optional AI summarization plugin

## Example

```bash
node src/cli.js --root . --verbose
```

Output:
- scans supported files
- updates only changed files in cache
- rewrites `PROJECT_MAP.md` and `FILE_INDEX.md`
- appends meaningful add/update/delete events to `CHANGELOG_AI.md`

## Project structure

```text
project-memory/
  src/
    analyzer.js
    cli.js
    dependencyGraph.js
    index.js
    scanner.js
    state.js
    summarizer.js
    output/writers.js
    parsers/javascript.js
    parsers/python.js
    utils/hash.js
  package.json
  README.md
```

## Plugin-ready extension points

- `src/parsers/`: add new language parser modules
- `src/summarizer.js`: integrate optional AI summarization strategy
- `src/output/writers.js`: customize markdown layout or add extra memory artifacts

