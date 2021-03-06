/* eslint import/no-extraneous-dependencies: ["error", {"devDependencies": true}] */

// Browser webpack config.  This will provide the foundation settings for
// configuring our source code to work in any modern browser

// ----------------------
// IMPORTS

import path from 'path';
import webpack from 'webpack';
import WebpackConfig from 'webpack-config';
import { spawn } from 'child_process';

import PATHS from '../../config/paths';
import { hostDevServer } from './base';

// ----------------------

let subprocess;

const plugins = [
  // Builds SERVER + VERSION into the build, the other values are often overriden at runtime
  new webpack.DefinePlugin({
    SERVER: true,
    VERSION: `"${ process.env.VERSION }"`,
    SHA: `"${ process.env.SHA }"`,
    API_ENDPOINT: `"${ process.env.API_ENDPOINT }"`,
    API_SECURE: process.env.API_SECURE === 'true',
    KEYCLOAK_REALM_NAME: `"${ process.env.KEYCLOAK_REALM_NAME }"`,
    KEYCLOAK_AUTH_SERVER_URL: `"${ process.env.KEYCLOAK_AUTH_SERVER_URL }"`,
    KEYCLOAK_CLIENT_ID: `"${ process.env.KEYCLOAK_CLIENT_ID }"`,
    KEYCLOAK_ON_LOAD: `"${ process.env.KEYCLOAK_ON_LOAD }"`,
  }),
];

if (hostDevServer()) {
  // Automatically start/stop SSR server when we're in dev server mode
  plugins.push({
    apply: compiler => {
      compiler.hooks.watchRun.tap('watchRunPlugin', compilation => {
        if (subprocess) {
          console.log('Killing webserver.');
          subprocess.kill();
        }
      });
    },
  });
  plugins.push({
    apply: compiler => {
      compiler.hooks.afterEmit.tap('AfterEmitPlugin', compilation => {
        console.log('Starting webserver.');
        subprocess = spawn('node', ['./dist/app.js']);

        subprocess.stdout.on('data', data => {
          console.log(`stdout: ${ data }`);
        });

        subprocess.stderr.on('data', data => {
          console.error(`stderr: ${ data }`);
        });

        subprocess.on('close', code => {
          console.log(`child process exited with code ${ code }`);
        });
      });
    },
  });
}

export default new WebpackConfig()
  .extend('[root]/base.js', conf => conf)
  .merge({
    target: 'node',

    node: {
      __dirname: true, // Fixes an issue with __dirname returning '/'
    },

    entry: {
      browser: [
        path.join(PATHS.entry, 'server.js'),
      ],
    },

    output: {
      path: PATHS.dist,
      publicPath: '',
      filename: 'app.js',
    },

    optimization: {
      runtimeChunk: false,
      minimize: false,
    },
    // Modules specific to our browser bundle
    module: {
      rules: [
      ],
    },
    plugins,

  });
