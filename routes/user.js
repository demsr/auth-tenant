const express = require("express");
const fs = require("fs");
const router = express.Router();

const User = require("../models/User");
const jwt = require("express-jwt");
const publicKey = fs.readFileSync("./public.key", "utf8");
const guard = require("express-jwt-permissions")();

const mongoose = require("mongoose");

router.use((req, res, next) => {
  console.log(req.headers);
  next();
});

router.use(jwt({ secret: publicKey, algorithms: ["RS256"] }));

router.use(guard.check("user:read"));

router.get("/", (req, res) => {
  let query = {};

  if (!req.user.permissions.includes("user:read:all")) {
    query.tenant = req.user.tenant;
  }

  console.log(query);

  User.find(query, (err, users) => {
    if (err) return res.status(500).send("user.find err");

    res.send(users);
  });
});

router.post("/", guard.check(["user:write"]), (req, res) => {
  let { name, tenant } = req.body;

  let query = { name: name, tenant: tenant };

  if (!req.user.permissions.includes("user:write:all")) {
    query.tenant = req.user.tenant;
  }

  new User(query).save((err, user) => {
    if (err) return res.status(500).send("err creating user");
    res.send(user);
  });
});

router.get("/:userid", (req, res) => {
  console.log(req.user);
  let { userid } = req.params;

  let query = {
    _id: userid,
  };

  if (!req.user.permissions.includes("user:read:all")) {
    query.tenant = req.user.tenant;
  }

  User.findOne(query, (err, user) => {
    if (err) return res.status(500).send("user.findbyid err");
    if (!user) return res.status(404).send("user not found");

    res.send(user);
  });
});

module.exports = router;
