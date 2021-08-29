require("dotenv").config();
const express = require("express");
const app = express();
const chalk = require("chalk");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const mdb = require("./db/MongoDB");

const LoginRouter = require("./routes/login");
const AuthRouter = require("./routes/auth");
const UserRouter = require("./routes/user");
const AppRouter = require("./routes/app");
const TenantRouter = require("./routes/tenant");

app.use(express.json());
app.use(
  cors({
    origin: ["http://localhost:3000", "http://localhost:4000"],
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

app.set("view engine", "ejs");

app.use("/", LoginRouter);
app.use("/auth", AuthRouter);
app.use("/api/app", AppRouter);
app.use("/api/user", UserRouter);
app.use("/api/tenant", TenantRouter);

mdb.once("open", () => {
  console.log(chalk.green("MongoDB connected"));
  app.listen(process.env.PORT, () => {
    console.log(`server running on port ${process.env.PORT}`);
  });
});
