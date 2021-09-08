const mongoose = require("mongoose");
const moment = require("moment");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const Redis = require("ioredis");
const redis = new Redis();

const privateKEY = fs.readFileSync(process.env.PRIVATEKEY, "utf8");

const Schema = new mongoose.Schema({
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

const Model = mongoose.model("RefUser", Schema, "RefUser");

redis.subscribe("user", "permission", (err, count) => {
  if (err) {
    // Just like other commands, subscribe() can fail for some reasons,
    // ex network issues.
    console.error("Failed to subscribe: %s", err.message);
  } else {
    // `count` represents the number of channels this client are currently subscribed to.
    console.log(
      `Subscribed successfully! This client is currently subscribed to ${count} channels.`
    );
  }
});

redis.on("message", async (channel, message) => {
  console.log(channel, message);
  message = JSON.parse(message);

  switch (channel) {
    case "user":
      Model.findById(message._id, (err, model) => {
        if (err) return console.log(err);
        if (!model) {
          new Model({ ...message, ref: message._id }).save((err) => {
            if (err) console.log(err);
            console.log("User created");
          });
        } else {
          Object.assign(model, message);
          model.save((err) => {
            if (err) console.log(err);
            console.log("User updated");
          });
        }
      });
      break;
    case "permission":
      Model.findById(message.userId, (err, model) => {
        if (err) return console.log(err);
        if (!model) return console.log("USER NOT FOUND");

        model.permissions = [...message.permissions];
        model.save((err) => {
          if (err) console.log(err);
        });
      });
      break;
  }
});

module.exports = Model;
