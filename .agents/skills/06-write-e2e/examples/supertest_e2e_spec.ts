import request from "supertest";
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { Client } from "pg"; // Direct database queries

const APP_URL = process.env.TEST_APP_URL || "http://localhost:3000";
const DB_CONN = process.env.TEST_DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/test_db";

describe("E2E: User Registration Integration Flow", () => {
  let dbClient: Client;

  beforeAll(async () => {
    dbClient = new Client({ connectionString: DB_CONN });
    await dbClient.connect();
    // Clean up testing environment
    await dbClient.query("DELETE FROM users WHERE email = $1", ["e2e_test@domain.com"]);
  });

  afterAll(async () => {
    await dbClient.end();
  });

  it("should successfully execute full registration flow and verify database persistence", async () => {
    const correlationId = "e2e-correlation-id-999";

    // 1. Trigger POST endpoint
    const response = await request(APP_URL)
      .post("/api/v1/users/register")
      .set("x-correlation-id", correlationId)
      .send({
        email: "e2e_test@domain.com",
        password: "securePassword123"
      });

    // Assert HTTP layer response
    expect(response.status).toBe(201);
    expect(response.headers["x-correlation-id"]).toBe(correlationId);

    // 2. Direct database validation to bypass application layers
    const dbResult = await dbClient.query("SELECT * FROM users WHERE email = $1", ["e2e_test@domain.com"]);
    expect(dbResult.rowCount).toBe(1);
    expect(dbResult.rows[0].verified).toBe(false);
  });
});
