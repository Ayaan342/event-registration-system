const assert = require("node:assert/strict");
const test = require("node:test");

let createApp;

try {
  ({ createApp } = require("../server"));
} catch {
  createApp = undefined;
}

async function startTestServer(database) {
  assert.equal(typeof createApp, "function", "server.js must export createApp");
  const server = createApp(database).listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  const { port } = server.address();

  return {
    baseUrl: `http://127.0.0.1:${port}`,
    close: () => new Promise((resolve) => server.close(resolve))
  };
}

test("POST /register rejects a request with missing fields", async () => {
  const database = { execute: async () => assert.fail("Database must not be called") };
  const testServer = await startTestServer(database);

  try {
    const response = await fetch(`${testServer.baseUrl}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ student_name: "Aarav Mehta" })
    });

    assert.equal(response.status, 400);
    assert.deepEqual(await response.json(), { message: "All fields are required" });
  } finally {
    await testServer.close();
  }
});

test("POST /register inserts a valid registration", async () => {
  const calls = [];
  const database = {
    execute: async (sql, values) => {
      calls.push({ sql, values });
      return [{ insertId: 1 }];
    }
  };
  const testServer = await startTestServer(database);
  const registration = {
    student_name: "Aarav Mehta",
    registration_number: "REG2026001",
    email: "aarav@example.com",
    department: "Computer Science",
    year_of_study: "Second Year",
    event_name: "AWS Cloud Workshop"
  };

  try {
    const response = await fetch(`${testServer.baseUrl}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(registration)
    });

    assert.equal(response.status, 201);
    assert.deepEqual(await response.json(), { message: "Registration successful" });
    assert.equal(calls.length, 1);
    assert.deepEqual(calls[0].values, Object.values(registration));
  } finally {
    await testServer.close();
  }
});

test("GET /registrations returns the database rows", async () => {
  const rows = [
    {
      student_name: "Aarav Mehta",
      registration_number: "REG2026001",
      event_name: "AWS Cloud Workshop"
    }
  ];
  const database = { execute: async () => [rows] };
  const testServer = await startTestServer(database);

  try {
    const response = await fetch(`${testServer.baseUrl}/registrations`);

    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), rows);
  } finally {
    await testServer.close();
  }
});

test("GET / serves the existing frontend", async () => {
  const database = { execute: async () => [] };
  const testServer = await startTestServer(database);

  try {
    const response = await fetch(`${testServer.baseUrl}/`);
    const html = await response.text();

    assert.equal(response.status, 200);
    assert.match(html, /College Event Registration Portal/);
  } finally {
    await testServer.close();
  }
});
