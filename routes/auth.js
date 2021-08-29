const express = require("express");

const router = express.Router();

const User = require("../models/User");
const redis = require("../db/Redis");
const { nanoid } = require("nanoid");

router.post("/accesstoken", (req, res) => {
  let { token } = req.body;

  if (!token) return res.status(400).send("missing token");

  redis.get(token, (err, authid) => {
    if (err) return res.status(500).send("redis err");

    User.findOne({ auth: authid }, async (err, user) => {
      if (err) return res.status(500).send("user.findone error");
      if (!user) return res.status(404).send("user not found");

      let jwt = await user.generateJWT();
      let refreshtoken = nanoid(64);
      redis.set(refreshtoken, user._id);
      console.log("setting cookie");
      res.cookie("refreshtoken", refreshtoken, {
        httpOnly: true,
        sameSite: "lax",
      });
      res.send({ jwt: jwt });
    });
  });
});

router.get("/refresh", (req, res) => {
  /**
   * checks request for cookie
   */

  console.log("Request: ", req.cookies);

  let { refreshtoken } = req.cookies;

  if (!refreshtoken) return res.status(400).send("no refres cookie found");

  redis.get(refreshtoken, (err, redis_res) => {
    if (err) return res.status(500).send({ message: "Redis error" });

    if (!redis_res) return res.status(404).send({ message: "unknown token" });

    User.findById(redis_res, async (err, user) => {
      if (err) return res.status(500).send();
      if (!user) return res.status(404).send({ message: "unknown user" });

      let jwt = await user.generateJWT();
      let newRefreshtoken = nanoid(200);
      redis.set(newRefreshtoken, user._id);

      res.cookie("refreshtoken", newRefreshtoken, { httpOnly: true });
      res.send({ jwt: jwt });
      redis.del(refreshtoken);
    });
  });
}); // returns cookie + jwt

module.exports = router;
