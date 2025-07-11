const path = require('path');
const dotenv = require('dotenv');
const moduleAlias = require('module-alias');

// Check the env
const NODE_ENV = (process.env.NODE_ENV ?? 'development');

// Configure "dotenv"
const result1 = dotenv.config({
  path: path.join(__dirname, `./config/.env`),
});
if (result1.error) {
  throw result1.error;
}

const result2 = dotenv.config({
  path: path.join(__dirname, `./config/.env.${NODE_ENV}`),
});
if (result2.error) {
  throw result2.error;
}

// Configure moduleAlias
if (__filename.endsWith('js')) {
  moduleAlias.addAlias('@src', __dirname + '/src');
}
