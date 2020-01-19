#!/usr/bin/env node

const fs = require("fs");
const Koa = require("koa");
const static = require("koa-static");
const watcher = require("chokidar");
const yaml = require("js-yaml");

//
// CLI
//

// Help message
const CLI_HELP = `A simple tool to generate a dashboard of objectives
from a YAML data file.

Usage:
  objmon <command> <data.yml> [options]

Available commands:
  serve    Serve a dashboard of objectives from the data file
  run      Parse the data file without starting a server

Flags:
  -w, --watch    Watch the data file for changes
  -h, --help     Display help
`;

// Parse command-line arguments
const args = process.argv.slice(2);
if (args.length === 0 || args.length === 1 && /--?h(elp)?/.test(args[0])) {
  console.log(CLI_HELP);
  process.exit(0);
} // else
if (args.length !== 2 && args.length !== 3) {
  console.log(CLI_HELP);
  console.error("Incorrect number of arguments");
  process.exit(1);
} // else
if (!["run", "serve"].includes(args[0])) {
  console.log(CLI_HELP);
  console.error(`Incorrect action '${args[0]}'`);
  process.exit(2);
} // else
if (!fs.existsSync(args[1])) {
  console.log(CLI_HELP);
  console.error(`Incorrect file '${args[1]}'`);
  process.exit(3);
}

//
// Data
//

var data = {};

/**
 * Load and parse data from file.
 */
function loadData() {
  console.log(`Loading ${args[1]}`);
  data = yaml.safeLoad(fs.readFileSync(args[1]));
  // Normalize data
  data.subjects.forEach((subject) => {
    if (!subject.objectives) {
      subject.objectives = [];
      return;
    }
    for (const o in subject.objectives) {
      if (Number.isInteger(subject.objectives[o])) {
        subject.objectives[o] = { progress: subject.objectives[o] };
      }
    }
  });
  // Set last load time
  data.lastLoadTime = new Date();
}

// Initial loading
loadData();

// Watch
if (/--?w(atch)?/.test(args[2])) {
  console.log(`Watching ${args[1]}`);
  watcher.watch(args[1], { awaitWriteFinish: { stabilityThreshold: 500 } })
    .on('change', () => { loadData(); });
}

//
// Serve
//

const SERVER_PORT = 3000;

if (args[0] === "serve") {
  const app = new Koa();
  app.use(static(`${__dirname}/web`));
  app.use(async ctx => {
    const req = ctx.request;
    if (req.method === "GET" && req.url === "/data") {
      ctx.body = data;
    }
  });
  app.listen(SERVER_PORT);
  console.log(`Listening on port ${SERVER_PORT}`);
}
