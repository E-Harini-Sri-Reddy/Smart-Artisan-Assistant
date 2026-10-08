import { describe, it, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { setupTestDB, teardownTestDB, clearCollections } from "./setup.js";

let app;

before(async () => {
  await setupTestDB();
  ({ app } = await import("../server.js"));
});

after(async () => {
  await teardownTestDB();
});

beforeEach(async () => {
  await clearCollections();
});

describe("Authentication", () => {
  it("registers an individual artisan with no organization", async () => {
    const res = await request(app).post("/api/auth/register").send({
      name: "Artisan One",
      email: "artisan1@example.com",
      password: "password123",
      role: "artisan",
    });

    assert.equal(res.status, 201);
    assert.equal(res.body.role, "artisan");
    assert.equal(res.body.accountType, "individual_artisan");
    assert.equal(res.body.organizationId, null);
    assert.equal(res.body.membershipRole, null);
    assert.ok(res.body.token);
    assert.ok(res.body._id);
  });

  it("registers an organization and makes creator admin", async () => {
    const res = await request(app).post("/api/auth/register").send({
      name: "Org Admin",
      email: "admin@example.com",
      password: "password123",
      role: "organization",
      organizationName: "Weavers Guild",
    });

    assert.equal(res.status, 201);
    assert.equal(res.body.role, "organization");
    assert.equal(res.body.accountType, "organization_member");
    assert.equal(res.body.membershipRole, "admin");
    assert.equal(res.body.organizationName, "Weavers Guild");
    assert.ok(res.body.organizationId);
  });

  it("logs in with valid credentials", async () => {
    await request(app).post("/api/auth/register").send({
      name: "Artisan",
      email: "login@example.com",
      password: "password123",
    });

    const res = await request(app).post("/api/auth/login").send({
      email: "login@example.com",
      password: "password123",
    });

    assert.equal(res.status, 200);
    assert.ok(res.body.token);
  });

  it("rejects invalid login", async () => {
    await request(app).post("/api/auth/register").send({
      name: "Artisan",
      email: "badlogin@example.com",
      password: "password123",
    });

    const res = await request(app).post("/api/auth/login").send({
      email: "badlogin@example.com",
      password: "wrongpassword",
    });

    assert.equal(res.status, 401);
    assert.match(res.body.message, /incorrect password/i);
  });

  it("tells unknown emails to register before signing in", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: "missing@example.com",
      password: "password123",
    });

    assert.equal(res.status, 404);
    assert.match(res.body.message, /register before signing in/i);
  });

  it("logs out when authenticated", async () => {
    const reg = await request(app).post("/api/auth/register").send({
      name: "Artisan",
      email: "logout@example.com",
      password: "password123",
    });

    const res = await request(app)
      .post("/api/auth/logout")
      .set("Authorization", `Bearer ${reg.body.token}`);

    assert.equal(res.status, 200);
  });

  it("forgot password does not reveal email existence", async () => {
    const res = await request(app).post("/api/auth/forgot-password").send({
      email: "missing@example.com",
    });

    assert.equal(res.status, 200);
    assert.match(res.body.message, /if an account/i);
    assert.equal(res.body.resetToken, undefined);
  });

  it("forgot + reset password flow works", async () => {
    await request(app).post("/api/auth/register").send({
      name: "Artisan",
      email: "reset@example.com",
      password: "password123",
    });

    const forgot = await request(app).post("/api/auth/forgot-password").send({
      email: "reset@example.com",
    });

    assert.equal(forgot.status, 200);
    assert.ok(forgot.body.resetToken);

    const reset = await request(app)
      .post(`/api/auth/reset-password/${forgot.body.resetToken}`)
      .send({ password: "newpassword123" });

    assert.equal(reset.status, 200);
    assert.ok(reset.body.token);

    const oldLogin = await request(app).post("/api/auth/login").send({
      email: "reset@example.com",
      password: "password123",
    });
    assert.equal(oldLogin.status, 401);

    const newLogin = await request(app).post("/api/auth/login").send({
      email: "reset@example.com",
      password: "newpassword123",
    });
    assert.equal(newLogin.status, 200);
  });

  it("change password requires current password", async () => {
    const reg = await request(app).post("/api/auth/register").send({
      name: "Artisan",
      email: "change@example.com",
      password: "password123",
    });

    const bad = await request(app)
      .put("/api/auth/change-password")
      .set("Authorization", `Bearer ${reg.body.token}`)
      .send({ currentPassword: "wrong", newPassword: "newpassword123" });
    assert.equal(bad.status, 401);

    const ok = await request(app)
      .put("/api/auth/change-password")
      .set("Authorization", `Bearer ${reg.body.token}`)
      .send({
        currentPassword: "password123",
        newPassword: "newpassword123",
      });
    assert.equal(ok.status, 200);
  });

  it("does not store plaintext passwords", async () => {
    const User = (await import("../models/User.js")).default;
    await request(app).post("/api/auth/register").send({
      name: "Artisan",
      email: "hash@example.com",
      password: "password123",
    });
    const user = await User.findOne({ email: "hash@example.com" }).select(
      "+password",
    );
    assert.notEqual(user.password, "password123");
    assert.ok(user.password.startsWith("$2"));
  });
});
