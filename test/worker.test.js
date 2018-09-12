const { fetch, Request, Response } = require('fetch-ponyfill')();
const { URL } = require('url');

global.fetch = fetch;
global.Request = Request;
global.Response = Response;
global.URL = URL;

/* eslint-env mocha */
const express = require('express');
const assert = require('assert');
const nock = require('nock');
const config = require('../config');

const worker = require('../worker');

const apiKey = 'OUW3RlI4gUCwWGpO10srIo2ufdWmMhMH';

describe('worker', () => {
  before(() => {
    nock.disableNetConnect();
    nock.enableNetConnect('127.0.0.1');
  });
  after(() => nock.cleanAll());

  describe('#fetchAndCollect()', () => {
    it('should make the request provided', async () => {
      const request = new global.Request('https://example.com/a?b=2', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({ c: 3, d: 4 }),
      });
      const mock = nock('https://example.com')
        .post('/a?b=2', JSON.stringify({ c: 3, d: 4 }))
        .reply(200);

      await worker.fetchAndCollect(request);
      mock.done();
    });

    it('should return a har file', async () => {
      const request = new global.Request('https://example.com/a?b=2', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({ c: 3, d: 4 }),
      });

      nock('https://example.com')
        .post('/a?b=2', JSON.stringify({ c: 3, d: 4 }))
        .reply(200, { response: true }, {
          'content-type': 'application/json',
          'x-response-header': 'hello',
        });

      const { har } = await worker.fetchAndCollect(request);

      assert.deepEqual(har.log.creator, { name: 'cloudflare worker', version: '0.0.0' });
      assert.deepEqual(har.log.entries[0].request, {
        method: request.method,
        url: request.url,
        // TODO get http version correctly?
        httpVersion: '1.1',
        headers: [
          {
            name: 'content-type',
            value: 'application/json',
          },
        ],
        queryString: [
          {
            name: 'b',
            value: '2',
          },
        ],
        postData: {
          mimeType: 'application/json',
          text: JSON.stringify({ c: 3, d: 4 }),
        },
      });

      assert.deepEqual(har.log.entries[0].response, {
        status: 200,
        statusText: 'OK',
        headers: [
          {
            name: 'content-type',
            value: 'application/json',
          },
          {
            name: 'x-response-header',
            value: 'hello',
          },
        ],
        content: {
          text: JSON.stringify({ response: true }),
          size: JSON.stringify({ response: true }).length,
          mimeType: 'application/json',
        },
      });
    });

    it('should return with a fresh response that can be read', async () => {
      const request = new global.Request('https://example.com/a?b=2', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({ c: 3, d: 4 }),
      });

      nock('https://example.com')
        .post('/a?b=2', JSON.stringify({ c: 3, d: 4 }))
        .reply(200, { response: true }, {
          'x-response-header': 'hello',
        });

      const { response } = await worker.fetchAndCollect(request);

      // If we can read the response body, then it means
      // it can be returned from the service worker
      await response.json();
    });
  });

  describe('#metrics()', () => {
    it('should make a request to the metrics api');
  });
});
