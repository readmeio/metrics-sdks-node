/* eslint-env worker */

async function getRequestBody(request) {
  if (request.method.match(/GET|HEAD/)) {
    return { req: request, body: null };
  }

  const body = await request.text();

  return {
    req: new Request(request.url, {
      method: request.method,
      headers: request.headers,
      body,
    }),
    body,
  };
}

async function getResponseBody(response) {
  const body = await response.text();

  return {
    res: new Response(body, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    }),
    body,
  };
}

module.exports.fetchAndCollect = async function fetchAndCollect(request) {
  const startedDateTime = new Date();

  const { req, body: requestBody } = await getRequestBody(request);

  const response = await fetch(req);

  const { res, body: responseBody } = await getResponseBody(response);

  const har = {
    log: {
      // TODO update the creator
      creator: { name: 'cloudflare worker', version: '0.0.0' },
      entries: [
        {
          startedDateTime: startedDateTime.toISOString(),
          time: new Date().getTime() - startedDateTime.getTime(),
          request: {
            method: req.method,
            url: req.url,
            // TODO get http version correctly?
            httpVersion: '1.1',
            headers: [...req.headers].map(([name, value]) => ({ name, value })),
            queryString: [...new URL(req.url).searchParams].map(([name, value]) => ({
              name,
              value,
            })),
            postData: {
              mimeType: req.headers.get('content-type') || 'application/json',
              text: requestBody,
            },
          },
          response: {
            status: res.status,
            statusText: res.statusText,
            headers: [...res.headers].map(([name, value]) => ({ name, value })),
            content: {
              text: responseBody,
              size: responseBody.length,
              mimeType: res.headers.get('content-type') || 'application/json',
            },
          },
        },
      ],
    },
  };

  return { har, response: res };
};

module.exports.metrics = function readme(apiKey, group, req, har) {
  /* eslint-disable no-console */
  return fetch('https://metrics.readme.io/request', {
    method: 'POST',
    headers: {
      authorization: `Basic ${btoa(`${apiKey}:`)}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify([
      {
        group,
        clientIPAddress: req.headers.get('cf-connecting-ip'),
        request: har,
      },
    ]),
  })
    .then(async response => {
      if (process.env.NODE_ENV !== 'testing') {
        console.log('Response from readme', response);
        console.log(await response.text());
      }
    })
    .catch(err => {
      if (process.env.NODE_ENV !== 'testing') console.error('Error saving log to readme', err);
      throw err;
    });
};
