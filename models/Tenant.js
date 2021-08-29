const mongoose = require("mongoose");
const moment = require("moment");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const redis = require("../db/Redis");

const privateKEY = fs.readFileSync("./private.key", "utf8");

const Schema = new mongoose.Schema({
  name: String,
  apps: [String],
});

module.exports = mongoose.model("Tenant", Schema);
