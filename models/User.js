const mongoose = require("mongoose");
const moment = require("moment");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const redis = require("../db/Redis");

const privateKEY = fs.readFileSync("./private.key", "utf8");

const Schema = new mongoose.Schema({
  name: String,
  tenant: mongoose.Types.ObjectId,
  permissions: [String],
});

Schema.methods.generateJWT = async function () {
  // let u = await this.populate("permissions").execPopulate();

  //const key = await redis.get(":tenant:" + this.tenant);

  //if (!key) throw new Error("key does not exit");

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

module.exports = mongoose.model("User", Schema);
