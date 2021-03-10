#!/usr/bin/env node

import { spawn, SpawnOptionsWithoutStdio } from "child_process";
// NodeJS.ProcessEnv

import path from "path";
// ${ path.join('node_modules', 'wsarkk', 'webpack.config.babel.js') }
// let webpack = spawn(`webpack serve --config ../kit/webpack.config.babel.js --hot --port 3000 --host 0.0.0.0`, {
// let webpack = spawn(`webpack serve --config ${ path.join('node_modules', 'wsarkk', 'webpack.config.babel.js') } --hot --port 3000 --host 0.0.0.0`, {


let abc = {
  // command: `webpack info`,
  command: 'webpack serve --hot --port 3000 --host 0.0.0.0',
  // command: `webpack serve --config ${ path.join('node_modules', 'wsarkk', 'webpack.config.babel.js') } --hot --port 3000 --host 0.0.0.0`,
  env: {
    ...process.env,
    DEV_SERVER: 'true',
    SSR: 'true',
    NODE_ENV: 'development',
    WEBPACK_CONFIG: 'browser,server',
  },
};

const commands = {
  'dev:ssr': abc,      
};

let options = {
  env: abc.env,
};

let webpack = spawn(abc.command, {
  shell: 'bash',
  env: abc.env,
  cwd: path.join(__dirname)
});

webpack.stdout.on('data', (data) => {
  console.log(`stdout: ${data}`);
});

webpack.stderr.on('data', (data) => {
  console.error(`stderr: ${data}`);
});

webpack.on('close', (code) => {
  console.log(`child process exited with code ${code}`);
});

const [,, args] = process.argv;
console.log(process.argv);
console.log(__dirname, __filename);
// 'NODE_ENV=development WEBPACK_CONFIG=browser webpack serve --config kit/webpack.config.babel.js --hot --port 3000 --host 0.0.0.0'