const express = require("express");
const cron = require("node-cron");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const bodyParser = require("body-parser");
const session = require("express-session");
const cookieParser = require("cookie-parser");
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
app.use(
  session({
    secret: "MailNews-Secret",
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1800000 },
  })
);
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set("view engine", "ejs");
app.use(express.static("src"));

let db = new sql.Database("mailNews.db", (err) => {});

db.run(
  "CREATE TABLE IF NOT EXISTS users (emailID TEXT PRIMARY KEY, emailHash TEXT NOT NULL, name TEXT NOT NULL, password TEXT NOT NULL, dos TEXT NOT NULL, interests TEXT NOT NULL, emailslot INTEGER NOT NULL, googleUID TEXT UNIQUE )"
);

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.OAUTH2_CLIENT_ID,
      clientSecret: process.env.OAUTH2_CLIENT_SECRET,
      callbackURL:
        process.env.NODE_ENV === "production"
          ? "https://mailnews.onrender.com/process-google-auth"
          : "http://localhost:10000/process-google-auth",
      scope: ["https://www.googleapis.com/auth/plus.login"],
    },
    function (accessToken, refreshToken, profile, done) {
      return done(null, profile._json);
    }
  )
);

app.use(passport.initialize());
app.use(passport.session());
passport.serializeUser(function (user, done) {
  done(null, user);
});

passport.deserializeUser(function (obj, done) {
  done(null, obj);
});

let mailer = nodemailer.createTransport({
  service: "gmail",
  host: "smtp.gmail.com",
  secure: false,
  auth: {
    type: "OAuth2",
    user: process.env.EMAIL,
    pass: process.env.PASSWORD,
    clientId: process.env.EMAILER_CLIENT_ID,
    clientSecret: process.env.EMAILER_CLIENT_SECRET,
    refreshToken: process.env.REFRESH_TOKEN,
  },
});

var slot = new Date().getUTCHours();
console.log(slot)
async function cronNews() {
  await newsWritter.generateNewsFiles();
  emailCurrentSlot();
}

async function emailCurrentSlot() {
  db.get(`SELECT * FROM users WHERE emailslot = ${slot}`, async (err, rows) => {
    rows.forEach(async (row) => {
      await mailer.sendMail({
        to: row.emailID,
        from: `MailNews ${process.env.EMAIL}`,
        subject: "MailNews | Your Daily News",
        html: `<h1>MailNews</h1>
        <p>Here Are Your Daily News</p>
        `,
      })
    });
  });
  slot++
  if(slot == 24){
    slot = 0;
  }
}



cron.schedule("0 * * * *", cronNews);

function inSubscribingProcessCheck(req, res, next) {
  if (req.session.currentSubs) {
    return next();
  } else {
    res.redirect("/signin");
  }
}
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated() || req.session.loggedin ) {
    return next();
  }
  res.status(401).redirect("/signin");
}
app.listen(10000, async () => {
  console.log("SERVER RUNNING ON PORT 10000 ");
});

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/src/index.html");
});

app.post("/signin", (req, res) => {
  db.get(
    `SELECT * FROM users WHERE emailID = "${req.body.email}"`,
    (err, row) => {
      if (row) {
        if (
          row.password ==
          crypto.createHash("sha256").update(req.body.pass).digest("hex")
        ) {
          req.session.loggedin = row.emailID;

          if (req.body.saveLogin) {
            res.cookie(
              "__logcred__",
              crypto.createHash("sha256").update(req.body.email).digest("hex") +
                "$" +
                crypto.createHash("sha256").update(req.body.pass).digest("hex"),
              { maxAge: 3600000 * 24 * 7, httpOnly: true }
            );
          }
          res.redirect("/dashboard");
        } else {
          res
            .status(401)
            .send("Wrong Password, Check Credentials And Try Again");
        }
      } else {
        res
          .status(404)
          .send("Account Not Found, Check Credentials And Try Again");
      }
    }
  );
});

app.get("/dashboard",ensureAuthenticated, (req, res) => {
  if(req.user){
    req.session.loggedin = req.user.email;
  }
  let email =  req.session.loggedin;

  db.get(`SELECT * FROM users WHERE emailID = "${email}"`, (err, row) => {
    if (row) {
      res.render(__dirname + "/src/dashboard.ejs", {
        selectedTopicsString: row.interests,
        timeSlot : row.emailslot
      });
    } else {
      res.status(404).send("Account Not Found");
    }
  });
});

app.post("/updateTopics", (req, res) => {
  if (req.session.loggedin) {
    db.run(
      "UPDATE users SET interests = ? WHERE emailID = ?",
      [req.body.topics, req.session.loggedin],
      (err, a) => {
        if (err) {
          res.sendStatus(500);
        } else {
          res.sendStatus(200);
        }
      }
    );
  } else {
    res.sendStatus(401);
  }
});

app.post("/updateSlot", (req, res) => {
  if (req.session.loggedin) {
    db.run(
      "UPDATE users SET emailslot = ? WHERE emailID = ?",
      [req.body.timeSlot, req.session.loggedin],
      (err, a) => {
        if (err) {
          console.log(err);
          res.sendStatus(500);
        } else {
          res.sendStatus(200);
        }
      }
    );
  }
  else {
    res.sendStatus(401);
  }
});

app.post("/subscribe", (req, res) => {
  console.log(req.body);
  db.get(
    `SELECT * FROM users WHERE emailID = "${req.body.email}"`,
    async (err, row) => {
      if (!row) {
        if (!req.session.currentSubs) {
          req.session.currentSubs = req.body;
          req.session.registrationCode = Math.random().toString().slice(3, 10);
          await mailer
            .sendMail({
              to: req.body.email,
              from: `MailNews ${process.env.EMAIL}`,
              subject: "Verify Your Email | MailNews",
              html: verificationMailBody.replace(
                "VERIFICATION_CODE",
                req.session.registrationCode
              ),
            })
            .catch((err) => {
              console.log(err);
            });
          res.status(200).send("Verification Code Sent");
        } else {
          res.redirect("/verify");
        }
      } else {
        res.status(409).send("Email Already Registered");
      }
    }
  );
});

app.get("/verify", inSubscribingProcessCheck, (req, res) => {
  res.sendFile(__dirname + "/src/emailverify.html");
});

app.post("/verifyEmail", inSubscribingProcessCheck, async (req, res) => {
  if (req.body.verificationCode == req.session.registrationCode) {
    db.run(
      `INSERT INTO users (emailID, emailHash, name, password, dos, interests, emailslot) VALUES(
        "${req.session.currentSubs.email}",
        "${crypto
          .createHash("sha256")
          .update(req.session.currentSubs.email)
          .digest("hex")}",
        "${req.session.currentSubs.name}",
        "${crypto
          .createHash("sha256")
          .update(req.session.currentSubs.pass)
          .digest("hex")}",
        "${new Date().toISOString()}",
        "${req.session.currentSubs.topics}",
        ${req.session.currentSubs.slot})`,
      (err) => {
        console.log(err);
        if (err) {
          res.status(400).send("Email Already Registered");
        } else {
          delete req.session.registrationCode;
          res.redirect("/registration-successful");
        }
      }
    );
  } else {
    res.status(400).send("Invalid Code");
  }
});

app.get(
  "/connect-google",
  inSubscribingProcessCheck,
  passport.authenticate("google", { scope: ["profile", "email"] })
);

app.get(
  "/google-login",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

app.get(
  "/process-google-auth",
  passport.authenticate("google", {
    failureRedirect: "/signin",
    successRedirect: "/google-auth-success",
    keepSessionInfo: true,
  })
);

app.get("/google-auth-success", ensureAuthenticated, (req, res) => {
  res.redirect(
    req.session.currentSubs ? "/connect-google-success" : "/dashboard"
  );
  delete req.session.currentSubs;
});

app.get("/connect-google-success", (req, res) => {
  db.run(
    `UPDATE users SET googleUID = '${req.user.sub}' WHERE emailID = '${req.session.currentSubs.email}'`,
    (err) => {
      if (err) {
        res.status(500).send("Error");
      } else {
        delete req.session.currentSubs;
        res.render(__dirname + "/src/google_auth_success.ejs", {
          email: req.user.email,
        });
      }
    }
  );
});

app.get("/registration-successful", inSubscribingProcessCheck, (req, res) => {
  res.sendFile(__dirname + "/src/register_success.html");
});
app.get("/signup", (req, res) => {
  res.sendFile(__dirname + "/src/signup.html");
});

app.get("/signin", (req, res) => {
  res.redirect("/login");
});
app.get("/login", (req, res) => {
  delete req.session.currentSubs;
  res.sendFile(__dirname + "/src/signin.html");
});
app.get("/autologin", (req, res) => {
  if (req.cookies.__logcred__) {
    res.sendStatus(202);
  }
});

app.post("/autologin", (req, res) => {
  var [hashedEmail, hashedPass] = req.cookies.__logcred__.split("$");
  db.get(
    `SELECT * FROM users WHERE emailHash = "${hashedEmail}"`,
    (err, row) => {
      if (row) {
        if (row.password == hashedPass) {
          req.session.loggedin = row.emailID;
          res.status(200).redirect("/dashboard");
        } else {
          res.sendStatus(406);
        }
      } else {
        res.sendStatus(406);
      }
    }
  );
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
