const path = require('path');

const root = path.join(__dirname);

// Only add 'dist' when we're using webpack
const dist = (process.env.WEBPACK_CONFIG) ? 'dist' : '.';

module.exports = {
  root,
  kit: path.join(root),
  entry: path.join(root, 'entry'),
  src: path.join(root, 'src'),
  static: path.join(root, 'static'),
  dist: path.join(root, dist),
  public: path.join(root, dist, 'public'),
};
