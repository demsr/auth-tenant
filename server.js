require("dotenv").config();
const express = require("express");
const app = express();
const chalk = require("chalk");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const { nanoid } = require("nanoid");

const mdb = require("./db/MongoDB");
const redis = require("./db/Redis");

const User = require("./models/AuthSchema");

app.use(express.json());
app.use(
  cors({
    origin: ["http://localhost:3000"],
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

app.post("/accesstoken", (req, res) => {
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

app.get("/refresh", (req, res) => {
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

mdb.once("open", () => {
  console.log(chalk.green("MongoDB connected"));
  app.listen(process.env.PORT, () => {
    console.log(`server running on port ${process.env.PORT}`);
  });
});
