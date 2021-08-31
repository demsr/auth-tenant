const mongoose = require("mongoose");
const moment = require("moment");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const redis = require("../db/Redis");

const privateKEY = fs.readFileSync(process.env.PRIVATEKEY, "utf8");

const Schema = new mongoose.Schema({
  ref: mongoose.Types.ObjectId,
  name: String,
  tenant: mongoose.Types.ObjectId,
  permissions: [String],
});

Schema.methods.generateJWT = async function () {
  return jwt.sign(
    {
      id: this._id,
      name: this.name,
      tenant: this.tenant,
      permissions: this.permissions,
      exp: moment().add(5, "minutes").toDate() / 1000,
    },
    privateKEY,
    { algorithm: "RS256" }
  );
};

module.exports = mongoose.model("RefUser", Schema, "RefUser");
