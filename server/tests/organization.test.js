import { describe, it, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { setupTestDB, teardownTestDB, clearCollections } from "./setup.js";

let app;

const registerOrg = async (email, orgName) => {
  const res = await request(app).post("/api/auth/register").send({
    name: "Admin",
    email,
    password: "password123",
    role: "organization",
    organizationName: orgName,
  });
  return res.body;
};

const registerArtisan = async (email) => {
  const res = await request(app).post("/api/auth/register").send({
    name: "Artisan",
    email,
    password: "password123",
    role: "artisan",
  });
  return res.body;
};

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

describe("Organizations & Membership", () => {
  it("creates organization with creator as admin", async () => {
    const admin = await registerOrg("a@example.com", "Org A");
    assert.equal(admin.membershipRole, "admin");

    const res = await request(app)
      .get("/api/organizations/me")
      .set("Authorization", `Bearer ${admin.token}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.name, "Org A");
  });

  it("renames organization (admin only)", async () => {
    const admin = await registerOrg("rename@example.com", "Old Name");
    const res = await request(app)
      .put("/api/organizations/rename")
      .set("Authorization", `Bearer ${admin.token}`)
      .send({ name: "New Name" });

    assert.equal(res.status, 200);
    assert.equal(res.body.name, "New Name");
  });

  it("org user cannot rename organization", async () => {
    const admin = await registerOrg("admin2@example.com", "Org B");
    await request(app)
      .post("/api/organizations/members")
      .set("Authorization", `Bearer ${admin.token}`)
      .send({
        name: "User",
        email: "user2@example.com",
        password: "password123",
        role: "user",
      });

    const login = await request(app).post("/api/auth/login").send({
      email: "user2@example.com",
      password: "password123",
    });

    assert.equal(login.body.role, "artisan");
    assert.equal(login.body.membershipRole, "user");

    const res = await request(app)
      .put("/api/organizations/rename")
      .set("Authorization", `Bearer ${login.body.token}`)
      .send({ name: "Hacked" });

    assert.equal(res.status, 403);
  });

  it("individual artisan has no organization membership", async () => {
    const artisan = await registerArtisan("solo@example.com");
    assert.equal(artisan.organizationId, null);

    const res = await request(app)
      .get("/api/organizations/me")
      .set("Authorization", `Bearer ${artisan.token}`);
    assert.equal(res.status, 403);
  });

  it("joining org reuses existing user identity", async () => {
    const artisan = await registerArtisan("join@example.com");
    const admin = await registerOrg("adminjoin@example.com", "Join Org");

    const invite = await request(app)
      .post("/api/organizations/members")
      .set("Authorization", `Bearer ${admin.token}`)
      .send({ email: "join@example.com", role: "user" });

    assert.equal(invite.status, 201);
    assert.equal(String(invite.body.user._id || invite.body.user), String(artisan._id));

    const login = await request(app).post("/api/auth/login").send({
      email: "join@example.com",
      password: "password123",
    });
    assert.equal(login.body.membershipRole, "user");
    assert.equal(String(login.body._id), String(artisan._id));
  });

  it("removed members lose access", async () => {
    const admin = await registerOrg("adminrem@example.com", "Rem Org");
    const invite = await request(app)
      .post("/api/organizations/members")
      .set("Authorization", `Bearer ${admin.token}`)
      .send({
        name: "RemUser",
        email: "remuser@example.com",
        password: "password123",
        role: "user",
      });

    await request(app)
      .delete(`/api/organizations/members/${invite.body._id}`)
      .set("Authorization", `Bearer ${admin.token}`);

    const login = await request(app).post("/api/auth/login").send({
      email: "remuser@example.com",
      password: "password123",
    });

    assert.equal(login.body.organizationId, null);
    assert.equal(login.body.accountType, "individual_artisan");
  });
});
