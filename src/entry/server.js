/* eslint-disable no-console */

import path from 'path';
import { readFileSync } from 'fs';
import PATHS from '../../paths';
import server, { createReactHandler } from '../../lib/server';

const manifest = JSON.parse(readFileSync(path.resolve(PATHS.public, 'manifest.json'), 'utf8'));

const css = manifest['browser.css'];
const scripts = [
  'manifest.js',
  'vendor.js',
  'browser.js',
].map(key => manifest[key]);

(async () => {
  console.log('Starting server..');
  const { app, router, listen } = server;

  router.get('(.*)', createReactHandler(css, scripts));
  app
    .use(router.routes())
    .use(router.allowedMethods());

  // Spawn the server
  listen();
})();
