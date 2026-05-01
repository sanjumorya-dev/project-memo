#!/usr/bin/env node

import { run } from './index.js';

function parseArgs(argv) {
  const args = {
    root: process.cwd(),
    verbose: false,
    withAi: false,
    help: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === '--root' && argv[i + 1]) {
      args.root = argv[i + 1];
      i += 1;
    } else if (token === '--verbose') {
      args.verbose = true;
    } else if (token === '--with-ai') {
      args.withAi = true;
    } else if (token === '--help' || token === '-h') {
      args.help = true;
    }
  }

  return args;
}

function printHelp() {
  console.log(`project-memory\n\nUsage:\n  project-memory [--root <path>] [--verbose] [--with-ai]\n\nOptions:\n  --root <path>   Target project path (default: current directory)\n  --verbose       Print file-level processing details\n  --with-ai       Enable optional AI summarization plugin hook\n  -h, --help      Show this message`);
}

(async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printHelp();
    process.exit(0);
  }

  try {
    const result = await run(args);
    console.log(`✅ project-memory complete.`);
    console.log(`Scanned: ${result.scanned} files, Changed: ${result.changed}, Unchanged: ${result.unchanged}`);
    console.log(`Updated: PROJECT_MAP.md, FILE_INDEX.md, CHANGELOG_AI.md`);
  } catch (error) {
    console.error('❌ project-memory failed:', error.message);
    process.exit(1);
  }
})();
