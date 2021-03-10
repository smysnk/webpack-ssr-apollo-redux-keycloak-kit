import Config, { environment } from 'webpack-config';
import browser from './webpack/browser';
import server from './webpack/server';

const configs = { browser, server };

const toExport = async () => {
  environment.setAll({
    root: () => __dirname,
  });

  const result = [];

  for (const build of (process.env.WEBPACK_CONFIG || '').trim().split(',')) {
    if (configs[build]) result.push(configs[build]);
  }

  if (!result.length) {
    console.error('Error: WEBPACK_CONFIG files not given');
    process.exit();
  }

  return result;
};

export default toExport;
