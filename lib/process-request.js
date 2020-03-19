const url = require('url');
const removeProperties = require('lodash/omit');
const removeOtherProperties = require('lodash/pick');

const objectToArray = require('./object-to-array');

module.exports = (req, options = {}) => {
  if (options.blacklist) {
    if (options.blacklist.body) req.body = removeProperties(req.body, options.blacklist.body);
    if (options.blacklist.headers) req.headers = removeProperties(req.headers, options.blacklist.headers);
  }

  if (options.whitelist) {
    if (options.whitelist.body) req.body = removeOtherProperties(req.body, options.whitelist.body);
    if (options.whitelist.headers) req.headers = removeOtherProperties(req.headers, options.whitelist.headers);
  }

  return {
    method: req.method,
    url: url.format({
      protocol: req.headers['x-forwarded-proto'] || req.protocol,
      host: req.headers['x-forwarded-host'] || req.get('host'),
      pathname: `${req.baseUrl}${req.path}`,
      query: req.query,
    }),
    httpVersion: `${req.protocol.toUpperCase()}/${req.httpVersion}`,
    headers: objectToArray(req.headers),
    queryString: objectToArray(req.query),
    postData: {
      mimeType: 'application/json',
      params: objectToArray(req.body || {}),
    },
  };
};
