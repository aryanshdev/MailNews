const express = require("express");
const cron = require("node-cron");
const bodyParser = require("body-parser");
const session = require("express-session");
const nodemailer = require("nodemailer");
let newsWritter = require("./newsGetter");
const sql = require("sqlite3").verbose();
const fileSystem = require("fs");
const crypto = require("crypto");
const e = require("express");
require("dotenv").config();
const verificationMailBody = `
<!DOCTYPE html>
<html>
<head>
  <style>
  body {
    padding: 2.5%;
  }
    .container {
      background-color: rgb(2, 6, 23);
      text-align: center;
      font-family: sans-serif;
      color: white;
      margin: 2.5%;
      padding: 2.5%;
      border-radius: 15px;
      border: 2.5px solid #009999;
    }
  </style>
</head>
<body>
  <div class="container">
    <p>MailNews</p>
    <img src="cid:loder.png" width="35%" alt="Verification Code" />
    <hr>
    <h2>Your Verification Code Is</h2>
    <h1>VERIFICATION_CODE</h1>
    <p>
      This Code Is Valid For 10 Minutes <br>
      Don't Share It With Anyone <br>
      If You Did Not Request A Verification Code, Please Ignore This Email.
    </p>
  </div>
</body>
</html>
`;

const app = express();

let db = new sql.Database("mailNews.db", (err) => {});

//google auth
let mailer = nodemailer.createTransport({
  service: "gmail",
  host: "smtp.gmail.com",
  secure: false,
  auth: {
    type: "OAuth2",
    user: process.env.EMAIL,
    pass: process.env.PASSWORD,
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    refreshToken: process.env.REFRESH_TOKEN,
  },
});

db.run("drop table if exists users");
db.run(
  "CREATE TABLE IF NOT EXISTS users (emailID TEXT PRIMARY KEY, name TEXT NOT NULL, password TEXT NOT NULL, dos DATE NOT NULL, interests TEXT NOT NULL, emailslot INTEGER NOT NULL )"
);

async function cronNews() {
  const currentDate = new Date();
  const formattedDateTime = `${currentDate.toLocaleDateString()}, ${currentDate.toLocaleTimeString()}`;

  console.log("Current date and time:", formattedDateTime);
  await newsWritter.generateNewsFiles();
  console.log("News Updated");
}

cron.schedule("0 */2 * * *", cronNews);

function inSubscribing(req, res, next) {
  if (req.session.currentSubs) {
    return next();
  } else {
    res.redirect("/signin");
  }
}

app.use(
  session({
    secret: "MailNews-Secret",
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 1800000 },
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.set("view engine", "ejs");

app.use(express.static("src"));

app.listen(10000, async () => {
  const currentDate = new Date();
  const formattedDateTime = `${currentDate.toLocaleDateString()}, ${currentDate.toLocaleTimeString()}`;
  console.log("Current date and time:", formattedDateTime);
  console.log("SERVER RUNNING ON PORT 10000 ");
});

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/src/index.html");
});

app.get("/dashboard", (req, res) => {
  res.sendFile(__dirname + "/src/dashboard.html");
});

app.post("/subscribe", async (req, res) => {
  req.session.currentSubs = req.body;
  req.session.registrationCode = Math.random().toString().slice(3, 10);
  await mailer.sendMail({
    to: req.body.email,
    from: `MailNews ${process.env.EMAIL}`,
    subject: "Verify Your Email | MailNews",
    html: verificationMailBody.replace(
      "VERIFICATION_CODE",
      req.session.registrationCode
    ),
  });
  res.status(200).send("Verification Code Sent");
});

app.get("/verify", inSubscribing, (req, res) => {
  res.sendFile(__dirname + "/src/emailverify.html");
});

app.post("/verifyEmail", inSubscribing, (req, res) => {
  if (req.body.verificationCode == req.session.registrationCode) {
    res.status(200).send("Email Verified");
  }
  else{
    res.status(400).send("Invalid Code");
  }
});


app.get("/registration-successful", inSubscribing, (req, res) => {
  res.sendFile(__dirname + "/src/register_success.html");
});
app.get("/signup", (req, res) => {
  res.sendFile(__dirname + "/src/signup.html");
});

app.get("/signin", (req, res) => {
  res.sendFile(__dirname + "/src/signin.html");
});
app.get("/login", (req, res) => {
  res.sendFile(__dirname + "/src/signin.html");
});

app.get("/news", (req, res) => {
  var business, entertainment, science, sports, tech, world;

  var business = JSON.parse(
    fileSystem.readFileSync(
      __dirname + "/businessNews.json",
      (error, data) => {}
    )
  );

  var entertainment = JSON.parse(
    fileSystem.readFileSync(
      __dirname + "/entertainmentNews.json",
      (error, data) => {}
    )
  );

  var science = JSON.parse(
    fileSystem.readFileSync(
      __dirname + "/scienceNews.json",
      (error, data) => {}
    )
  );

  var sports = JSON.parse(
    fileSystem.readFileSync(__dirname + "/sportNews.json", (error, data) => {})
  );

  var tech = JSON.parse(
    fileSystem.readFileSync(__dirname + "/techNews.json", (error, data) => {})
  );

  var world = JSON.parse(
    fileSystem.readFileSync(__dirname + "/worldNews.json", (error, data) => {})
  );

  res.render(__dirname + "/src/news.ejs", {
    businessNews: business,
    entertainmentNews: entertainment,
    scienceNews: science,
    sportsNews: sports,
    techNews: tech,
    worldNews: world,
  });
});

app.get("/ping", (req, res) => {
  res.status(200).send("<h1>PONG<h1>");
});

// At Last
app.get("*", (req, res) => {
  res.status(404).sendFile(__dirname + "/src/404.html");
});
