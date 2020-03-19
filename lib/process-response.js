const removeProperties = require('lodash/omit');
const removeOtherProperties = require('lodash/pick');

const objectToArray = require('./object-to-array');

module.exports = (res, options = {}) => {
  // Here we have to reconstruct the body
  // from the string that we've buffered up
  // We have to do this so we can strip out
  // any whitelist/blacklist properties
  let body;
  try {
    body = JSON.parse(res._body);

    // Only apply blacklist/whitelist if it's an object
    if (options.blacklist && options.blacklist.body) {
      body = removeProperties(body, options.blacklist.body);
    }

    if (options.whitelist && options.whitelist.body) {
      body = removeOtherProperties(body, options.whitelist.body);
    }
  } catch (e) {
    // Non JSON body
    body = res._body;
  }

  let headers = res.getHeaders();

  if (options.blacklist && options.blacklist.headers) {
    headers = removeProperties(headers, options.blacklist.headers);
  }

  if (options.whitelist && options.whitelist.headers) {
    headers = removeOtherProperties(headers, options.whitelist.headers);
  }

  return {
    status: res.statusCode,
    statusText: res.statusMessage,
    headers: objectToArray(headers),
    content: {
      text: JSON.stringify(body),
      size: res.get('content-length') || 0,
      mimeType: res.get('content-type'),
    },
  };
};
