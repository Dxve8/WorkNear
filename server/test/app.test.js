const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');

const app = require('../app');

test('GET /api/health reports that the API is available', async () => {
  const response = await request(app).get('/api/health');

  assert.equal(response.status, 200);
  assert.equal(response.body.success, true);
  assert.equal(response.body.message, 'WorkNear API is running');
});

test('unknown API routes return the standard not-found response', async () => {
  const response = await request(app).get('/api/not-a-real-route');

  assert.equal(response.status, 404);
  assert.deepEqual(response.body, {
    success: false,
    message: 'Route not found',
  });
});

test('protected business routes reject requests without authentication', async () => {
  const response = await request(app).post('/api/business').send({});

  assert.equal(response.status, 401);
  assert.equal(response.body.success, false);
  assert.equal(response.body.message, 'Not authorized, no token provided');
});
