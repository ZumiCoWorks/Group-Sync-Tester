const serverless = require('serverless-http');
const app = require('../index').default;

module.exports = serverless(app);
