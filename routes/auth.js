// This router collects all the /login routes in a separate router
const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");

let usersCollection = null;

// now using Promise instead of callback
const MongoClient = require("mongodb")
  .MongoClient.connect(process.env.MONGODB_THEMECHAT_USERS_RW, {
    useNewUrlParser: true
  })
  .then(client => {
    console.log("Auth connected to MongoDb" + client);
    usersCollection = client
      .db(process.env.MONGODB_DBNAME)
      .collection(process.env.AUTH_MONGODB_COLLECTION);
    return client;
  })
  .catch(err => {
    console.error("Auth could not connect to MongoDB" + err);
  });

const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const strategy = new LocalStrategy(function(username, password, done) {
  // again, done is a callback with parameters (error, user) -- user is the full object
  console.log("Attempting login for " + username);
  // no one will every guess this "password"!
  usersCollection
    .find({ username: username })
    .limit(1)
    .toArray(function(err, docs) {
      if (err) {
        console.error(err);
      } else {
        let user = docs[0];
        console.log(
          "found user" + user.username + "passhash: " + user.passhash
        );
        if (bcrypt.compareSync(password, user.passhash)) {
          console.log("bycrypt");
          return done(null, user);
        } else {
          console.log("bcrypt else");
          return done(null, false);
        }
      }
    });
});

/////////////////////////////
////// Creating new user ////
////////////////////////////

// display authentication landing page
router.get("/", function(req, res) {
  res.render("auth/auth");
});

// display new user signup page
router.get("/newuser", function(req, res) {
  res.render("auth/newuser");
});

// create new user in MongoDB
router.post("/newuser", function(req, res) {
  /** @todo check that username isn't taken */
  /** @todo check that password and password2 match */
  /** @todo check that email address is properly formatted */
  // finish the promise.all
  const user = {
    username: req.body.username,
    email: req.body.email,
    passhash: bcrypt.hashSync(
      req.body.password,
      parseInt(process.env.AUTH_BCRYPT_COST)
    )
  };

  Promise.all([
    isEmailValidPromise(user.email),
    isUsernameValidPromise(user.username)
  ]).then(resultsOfAll => {
    insertUserPromise(user)
      .then(() => {
        console.log("welcome New user");
        // req.session.flashMessage = require("../lib/flashMessage").notice(
        //   "Welcome new user"
        // );
      })
      .catch(() => {
        console.log("could not save new user");
        // req.session.flashMessage = flashMessage.error(
        //   "Could not save new user"
        // );
      })
      .finally(() => {
        res.redirect(req.baseUrl);
      });
  });

  if (!/.+@.+\..+/.test(user.email)) {
    // req.session.flashMessage = require("../lib/flashMessage").error(
    //   "not an email address"
    // );
    alert("not an email address");
    res.redirect(req.baseUrl + "/newuser");
  }
});

// display our login page
router.get("/login", function(req, res) {
  res.render("auth/login");
});

router.get("/isUsernameAvailable", (req, res) => {
  isUsernameAvailable(req.query.username).then(data => res.json(data));
});

function isUsernameAvailable(username) {
  return new Promise((resolve, reject) => {
    MongoClient.then(client => {
      usersCollection
        .countDocuments({ username })
        .then(c => {
          console.log("there are" + c + "users with the username" + username);
          resolve(c === 0);
        })
        .catch(err => {
          console.error(
            "Could not check usernam " + username + " because " + err
          );
          reject(); //cannot fulfill so reject
        });
      return client;
    }).catch(() => {
      console.error("could not check username because mongoDb didnt connect");
      reject(); //cannot fulfill so reject
    }); //mongo client
  });
}

const isEmailValidPromise = function(email) {
  return new Promise((resolve, reject) => {
    if (/.+@.+\..+/.test(email)) {
      resolve(email);
    } else {
      reject("failed pattern match");
    }
  });
};

const insertUserPromise = function(user) {
  return new Promise((resolve, reject) => {
    MongoClient.then(() => {
      usersCollection.insertOne(user);
    })
      .then(() => {
        console.log("user inserted yay");
        resolve(user);
      })
      .catch(err => {
        console.log("didnt work" + err);
        reject("something messed up");
      });
  });
};
const isUsernameValidPromise = function(username) {
  return new Promise((resolve, reject) => {
    isUsernameAvailable(username)
      .then(available => {
        if (available) {
          resolve(username);
        } else {
          reject("Username taken");
        }
      })
      .catch(err => {
        reject("Could not check username: " + err);
      });
  });
};

// handle authentication of posted username and password
router.post(
  "/login", // i.e., a post to /auth/login
  // FIRST, use our local strategy to authenticate
  passport.authenticate("local", {
    successReturnToOrRedirect: "/", // go to the home page if we can't figure out where the user wanted to go
    failureRedirect: "/auth/login" // would prefer to get this programmatically, eg., req.baseUrl
  }),
  // here's a backup behavior in case passport doesn't do anything:
  function(req, res) {
    console.error("Surprise! POST /auth/login used Backup function");
    res.redirect("/"); // maybe not the best choice, but let's keep it simple
  }
);

// make a little page to hash a password for me
router.get("/hash/:password", (req, res) => {
  res.json({
    password: req.params.password,
    hash: bcrypt.hashSync(req.params.password, 10)
  });
});

module.exports = { router, strategy };
