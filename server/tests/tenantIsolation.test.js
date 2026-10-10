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

describe("Tenant isolation & product assignment", () => {
  it("Organization A cannot read Organization B production/payments", async () => {
    const orgA = await registerOrg("orga@example.com", "Org A");
    const orgB = await registerOrg("orgb@example.com", "Org B");

    const created = await request(app)
      .post("/api/production")
      .set("Authorization", `Bearer ${orgB.token}`)
      .send({
        productName: "Secret Pot",
        category: "Pottery",
        quantity: "10",
        cost: 100,
        date: new Date().toISOString(),
      });
    assert.equal(created.status, 201);

    const payment = await request(app)
      .post("/api/payments")
      .set("Authorization", `Bearer ${orgB.token}`)
      .send({
        customer: "Buyer",
        product: "Secret Pot",
        amount: 500,
        status: "Completed",
        paymentDate: new Date().toISOString(),
      });
    assert.equal(payment.status, 201);

    const listA = await request(app)
      .get("/api/production")
      .set("Authorization", `Bearer ${orgA.token}`);
    assert.equal(listA.status, 200);
    assert.equal(listA.body.length, 0);

    const payA = await request(app)
      .get("/api/payments")
      .set("Authorization", `Bearer ${orgA.token}`);
    assert.equal(payA.status, 200);
    assert.equal(payA.body.length, 0);

    // Tamper: try to update B's production with A's token + B's id
    const tamper = await request(app)
      .put(`/api/production/${created.body._id}`)
      .set("Authorization", `Bearer ${orgA.token}`)
      .send({ productName: "Hacked" });
    assert.equal(tamper.status, 404);

    const deleteTamper = await request(app)
      .delete(`/api/production/${created.body._id}`)
      .set("Authorization", `Bearer ${orgA.token}`);
    assert.equal(deleteTamper.status, 404);

    const payTamper = await request(app)
      .put(`/api/payments/${payment.body._id}`)
      .set("Authorization", `Bearer ${orgA.token}`)
      .send({ amount: 1 });
    assert.equal(payTamper.status, 404);
  });

  it("client-supplied organizationId cannot escalate access", async () => {
    const orgA = await registerOrg("escA@example.com", "Esc A");
    const orgB = await registerOrg("escB@example.com", "Esc B");

    const res = await request(app)
      .post("/api/production")
      .set("Authorization", `Bearer ${orgA.token}`)
      .send({
        productName: "Item",
        category: "Cat",
        quantity: "1",
        cost: 10,
        date: new Date().toISOString(),
        organization: orgB.organizationId,
        organizationId: orgB.organizationId,
      });

    assert.equal(res.status, 201);
    assert.equal(String(res.body.organization), String(orgA.organizationId));
  });

  it("individual artisan cannot access org production/payments/members", async () => {
    const artisan = await registerArtisan("soloiso@example.com");
    const org = await registerOrg("orgiso@example.com", "Org Iso");

    const prod = await request(app)
      .get("/api/production")
      .set("Authorization", `Bearer ${artisan.token}`);
    assert.equal(prod.status, 403);

    const pay = await request(app)
      .get("/api/payments")
      .set("Authorization", `Bearer ${artisan.token}`);
    assert.equal(pay.status, 403);

    const members = await request(app)
      .get("/api/organizations/members")
      .set("Authorization", `Bearer ${artisan.token}`);
    assert.equal(members.status, 403);

    // Org admin cannot see artisan personal inventory
    await request(app)
      .post("/api/inventory")
      .set("Authorization", `Bearer ${artisan.token}`)
      .send({
        name: "Private Clay",
        itemType: "material",
        stock: 5,
        maxStock: 20,
        unit: "kg",
      });

    const inv = await request(app)
      .get("/api/inventory")
      .set("Authorization", `Bearer ${org.token}`);
    // Admin can call inventory (artisan access allowed) but sees only their own empty set
    assert.equal(inv.status, 200);
    assert.equal(inv.body.length, 0);
  });

  it("inventory is isolated between artisans", async () => {
    const a1 = await registerArtisan("inv1@example.com");
    const a2 = await registerArtisan("inv2@example.com");

    const item = await request(app)
      .post("/api/inventory")
      .set("Authorization", `Bearer ${a1.token}`)
      .send({
        name: "Yarn",
        itemType: "material",
        stock: 3,
        maxStock: 10,
        unit: "pcs",
      });
    assert.equal(item.status, 201);

    const list2 = await request(app)
      .get("/api/inventory")
      .set("Authorization", `Bearer ${a2.token}`);
    assert.equal(list2.body.length, 0);

    const steal = await request(app)
      .put(`/api/inventory/${item.body._id}`)
      .set("Authorization", `Bearer ${a2.token}`)
      .send({ name: "Stolen" });
    assert.equal(steal.status, 404);
  });

  it("admin can assign products within org; cross-org assignment fails", async () => {
    const orgA = await registerOrg("pa@example.com", "Prod A");
    const orgB = await registerOrg("pb@example.com", "Prod B");

    await request(app)
      .post("/api/organizations/members")
      .set("Authorization", `Bearer ${orgA.token}`)
      .send({
        name: "User A",
        email: "usera@example.com",
        password: "password123",
        role: "user",
      });

    const userALogin = await request(app).post("/api/auth/login").send({
      email: "usera@example.com",
      password: "password123",
    });

    const productA = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${orgA.token}`)
      .send({ name: "Product A" });
    assert.equal(productA.status, 201);

    const productB = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${orgB.token}`)
      .send({ name: "Product B" });
    assert.equal(productB.status, 201);

    const due = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const ok = await request(app)
      .post("/api/products/assignments")
      .set("Authorization", `Bearer ${orgA.token}`)
      .field("productId", productA.body._id)
      .field("userId", userALogin.body._id)
      .field("assignmentType", "Customization")
      .field("priority", "High")
      .field("offeredPay", "1500")
      .field("dueDate", due)
      .field("notes", "Finish carefully");
    assert.equal(ok.status, 201);
    assert.ok(ok.body.assignmentNumber);
    assert.equal(ok.body.status, "Assigned");
    assert.equal(ok.body.offeredPay, 1500);

    // Same product + artisan can receive another assignment
    const ok2 = await request(app)
      .post("/api/products/assignments")
      .set("Authorization", `Bearer ${orgA.token}`)
      .field("productId", productA.body._id)
      .field("userId", userALogin.body._id)
      .field("assignmentType", "Repair")
      .field("priority", "Medium")
      .field("offeredPay", "800")
      .field("dueDate", due)
      .field("notes", "Second job on same product");
    assert.equal(ok2.status, 201);
    assert.notEqual(ok2.body._id, ok.body._id);

    // Missing offered pay fails
    const noPay = await request(app)
      .post("/api/products/assignments")
      .set("Authorization", `Bearer ${orgA.token}`)
      .field("productId", productA.body._id)
      .field("userId", userALogin.body._id)
      .field("assignmentType", "Repair")
      .field("dueDate", due)
      .field("notes", "x");
    assert.equal(noPay.status, 400);

    // Cross-org: Org A product to Org B admin user
    const cross = await request(app)
      .post("/api/products/assignments")
      .set("Authorization", `Bearer ${orgA.token}`)
      .field("productId", productA.body._id)
      .field("userId", orgB._id)
      .field("assignmentType", "Repair")
      .field("offeredPay", "100")
      .field("dueDate", due)
      .field("notes", "x");
    assert.equal(cross.status, 400);

    // Org B product assigned using Org A admin (product not in org)
    const crossProduct = await request(app)
      .post("/api/products/assignments")
      .set("Authorization", `Bearer ${orgA.token}`)
      .field("productId", productB.body._id)
      .field("userId", userALogin.body._id)
      .field("assignmentType", "Repair")
      .field("offeredPay", "100")
      .field("dueDate", due)
      .field("notes", "x");
    assert.equal(crossProduct.status, 404);

    // Org user cannot assign
    const userAssign = await request(app)
      .post("/api/products/assignments")
      .set("Authorization", `Bearer ${userALogin.body.token}`)
      .field("productId", productA.body._id)
      .field("userId", userALogin.body._id)
      .field("assignmentType", "Repair")
      .field("offeredPay", "100")
      .field("dueDate", due)
      .field("notes", "x");
    assert.equal(userAssign.status, 403);

    // Individual artisan cannot receive org assignment via wrong org membership check
    const solo = await registerArtisan("nosoloassign@example.com");
    const soloAssign = await request(app)
      .post("/api/products/assignments")
      .set("Authorization", `Bearer ${orgA.token}`)
      .field("productId", productA.body._id)
      .field("userId", solo._id)
      .field("assignmentType", "Repair")
      .field("offeredPay", "100")
      .field("dueDate", due)
      .field("notes", "x");
    assert.equal(soloAssign.status, 400);

    // Artisan can negotiate pay before accepting
    const negotiate = await request(app)
      .post(`/api/products/assignments/${ok.body._id}/negotiate`)
      .set("Authorization", `Bearer ${userALogin.body.token}`)
      .send({
        message: "This feels low for the scope",
        proposedPay: 2000,
      });
    assert.equal(negotiate.status, 200);
    assert.equal(negotiate.body.status, "Assigned");
    assert.ok(
      negotiate.body.priceMessages.some(
        (m) => m.role === "artisan" && m.proposedPay === 2000,
      ),
    );

    const reply = await request(app)
      .post(`/api/products/assignments/${ok.body._id}/price-reply`)
      .set("Authorization", `Bearer ${orgA.token}`)
      .send({
        message: "We can do 1800",
        offeredPay: 1800,
      });
    assert.equal(reply.status, 200);
    assert.equal(reply.body.offeredPay, 1800);

    // Artisan workflow: accept → start
    const mine = await request(app)
      .get("/api/products/assignments/mine")
      .set("Authorization", `Bearer ${userALogin.body.token}`);
    assert.equal(mine.status, 200);
    assert.equal(mine.body.length, 2);

    const accept = await request(app)
      .post(`/api/products/assignments/${ok.body._id}/accept`)
      .set("Authorization", `Bearer ${userALogin.body.token}`)
      .send({
        startDate: new Date().toISOString(),
        estimatedCompletionDate: new Date(
          Date.now() + 2 * 24 * 60 * 60 * 1000,
        ).toISOString(),
      });
    assert.equal(accept.status, 200);
    assert.equal(accept.body.status, "Accepted");
    assert.ok(accept.body.startDate);
    assert.ok(accept.body.estimatedCompletionDate);
    assert.equal(accept.body.offeredPay, 1800);

    const start = await request(app)
      .post(`/api/products/assignments/${ok.body._id}/start`)
      .set("Authorization", `Bearer ${userALogin.body.token}`);
    assert.equal(start.status, 200);
    assert.equal(start.body.status, "In Progress");

    // Reject flow on second assignment
    const reject = await request(app)
      .post(`/api/products/assignments/${ok2.body._id}/reject`)
      .set("Authorization", `Bearer ${userALogin.body.token}`)
      .send({ reason: "Schedule conflict this week" });
    assert.equal(reject.status, 200);
    assert.equal(reject.body.status, "Rejected");
    assert.equal(reject.body.rejectionReason, "Schedule conflict this week");
  });

  it("org user cannot access other org members/settings rename", async () => {
    const orgA = await registerOrg("ua@example.com", "User Org A");
    await request(app)
      .post("/api/organizations/members")
      .set("Authorization", `Bearer ${orgA.token}`)
      .send({
        name: "Member",
        email: "membera@example.com",
        password: "password123",
        role: "user",
      });
    const member = await request(app).post("/api/auth/login").send({
      email: "membera@example.com",
      password: "password123",
    });

    const members = await request(app)
      .get("/api/organizations/members")
      .set("Authorization", `Bearer ${member.body.token}`);
    assert.equal(members.status, 403);
  });

  it("reports are organization-scoped", async () => {
    const orgA = await registerOrg("ra@example.com", "Report A");
    const orgB = await registerOrg("rb@example.com", "Report B");

    await request(app)
      .post("/api/payments")
      .set("Authorization", `Bearer ${orgB.token}`)
      .send({
        customer: "X",
        product: "Y",
        amount: 999,
        status: "Completed",
        paymentDate: new Date().toISOString(),
      });

    const reportsA = await request(app)
      .get("/api/reports")
      .set("Authorization", `Bearer ${orgA.token}`);
    assert.equal(reportsA.status, 200);
    assert.equal(reportsA.body.totalEarnings, 0);
  });
});
