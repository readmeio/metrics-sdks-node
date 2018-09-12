const fetch = require('node-fetch');
const config = require('../config');

module.exports = async apiKey => {
  if (!module.exports.cachedReadmeData[apiKey]) {
    const encoded = Buffer.from(`${apiKey}:`).toString('base64');
    try {
      const response = await fetch(`${config.readmeUrl}/api/v1/`, {
        method: 'GET',
        headers: { authorization: `Basic ${encoded}` },
      });
      const json = await response.json();
      if (json.error) {
        throw new Error(json.error);
      }
      module.exports.cachedReadmeData[apiKey] = json;
    } catch (e) {
      throw new Error('Invalid ReadMe API Key');
    }
  }

  return module.exports.cachedReadmeData[apiKey];
};

module.exports.cachedReadmeData = {};
