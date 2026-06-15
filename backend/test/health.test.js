const assert = require("node:assert/strict");
const { after, before, test } = require("node:test");

const app = require("../src/app");

let baseUrl;
let server;

before(async () => {
  server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));

  const { port } = server.address();
  baseUrl = `http://127.0.0.1:${port}`;
});

after(async () => {
  await new Promise((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
});

test("GET /api/health returns the server status", async () => {
  const response = await fetch(`${baseUrl}/api/health`);
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.deepEqual(body, {
    status: "ok",
    message: "Golabob API가 정상적으로 동작 중입니다.",
  });
});
