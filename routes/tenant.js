const express = require("express");

const router = express.Router();

const Tenant = require("../models/Tenant");

const fs = require("fs");
const jwt = require("express-jwt");
const publicKey = fs.readFileSync("./public.key", "utf8");
const guard = require("express-jwt-permissions")();
router.use(jwt({ secret: publicKey, algorithms: ["RS256"] }));

router.use(guard.check("tenant:read"));

router.get("/:tenantId?", (req, res) => {
  let { tenantId } = req.params;

  if (!req.user.permissions.includes("tenant:read:all")) {
    tenantId = req.user.tenant;
  } else {
    tenantId = tenantId ? tenantId : req.user.tenant;
  }

  Tenant.findById(tenantId, (err, tenant) => {
    if (err) return res.status(500).send("user.find err");
    if (!tenant) return res.status(404).send("tenant not found");

    res.send(tenant);
  });
});

router.get("/all", (req, res) => {
  Tenant.find({}, (err, tenant) => {
    if (err) return res.status(500).send("user.find err");

    res.send(tenant);
  });
});

router.post("/", guard.check(["tenant:create"]), (req, res) => {
  let { name } = req.body;

  new Tenant({
    name: name,
  }).save((err, tenant) => {
    if (err) return res.status(500).send("err creating tenant");
    res.send(tenant);
  });
});

module.exports = router;
