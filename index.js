require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const app = express();
app.set("port", process.env.PORT || 3000);

app.use(bodyParser.json());

//////////////////////////////
/// PASSPORT AUTHENTICATION
/////////////////////////////
const passport = require("passport"),
  LocalStrategy = require("passport-local").Strategy,
  ensureLoggedIn = require("connect-ensure-login").ensureLoggedIn,
  bcrypt = require("bcryptjs");

passport.serializeUser(function(user, done) {
  done(null, user);
});
passport.deserializeUser(function(user, done) {
  done(null, user);
});
passport.use(require("./routes/auth").strategy);

/////////////////////////
////// Handlebars
////////////////////////
const handlebars = require("express-handlebars").create({
  defaultLayout: "main",
  helpers: {
    urlEncode: encodeURIComponent,
    ifEquals: function(arg1, arg2, options) {
      return arg1 == arg2 ? options.fn(this) : options.inverse(this);
    },
    section: function(name, options) {
      if (!this._sections) this._sections = {};
      this._sections[name] = options.fn(this);
      return null;
    } // from Ethan Brown's Web Development with Node and Express
  }
});
app.engine("handlebars", handlebars.engine);
app.set("view engine", "handlebars");

////////////////
////SESSIONS///
///////////////
// knows how to read/write cookies since v1.5; no separate cookie-parser needed
const session = require("express-session");

// parse application/x-www-form-urlencoded
// saves all the name=value pairs from a form POST
// into the req.body object.
app.use(bodyParser.urlencoded({ extended: false }));

// handle session data
app.use(session(require("./config/session"))); //don't worry; the require happens only once!

// passport depends on the session, so must come after
app.use(passport.initialize());
app.use(passport.session());

app.use(function(req, res, next) {
  res.locals.user = req.user;
  next();
});

app.use(express.static("public"));

app.use((req, res, next) => {
  if (req.query.vidId) {
    req.session.vidId = req.query.vidId;
  }
  if (req.body.username) {
    console.log(req.body.username + "in app use");
    req.session.username = req.body.username;
  }
  if (!res.locals) {
    //if there is no res locals make one
    res.locals = {};
  }
  //set res local equal to the name stored in the session
  res.locals.username = req.session.username;
  res.locals.vidId = req.session.vidId;
  next();
});

app.get("/", function(req, res) {
  res.render("home");
});

// any path beginning /tracker will be routed to our
// tracker router.
app.use("/auth", require("./routes/auth").router);
app.use("/tracker", ensureLoggedIn("/auth"), require("./routes/tracker"));
app.use("/favorites", ensureLoggedIn("/auth"), require("./routes/favorites"));
// this would work, too:
// app.use('/talk', require('./routes/chat'));
//Also moved let messages=[] from initialization to router.

app.get("/logout", function(req, res) {
  req.session.username = "";
  req.logout();
  res.redirect("/");
});

// page not found:
app.use((req, res) => {
  res.status(404);
  res.send("404");
});

// script error:
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500);
  res.send("Server error 500");
});

app.listen(app.get("port"), () => {
  console.log(
    "CBT started on http://localhost:" +
      app.get("port") +
      "/\r\nPress Ctrl-C to end."
  );
});
