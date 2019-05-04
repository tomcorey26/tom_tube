const express = require("express");
const router = express.Router();
module.exports = router;

let usersCollection = null;
//return data from database in here
router.get("/", (req, res) => {
  res.render("favorites");
});

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

router.post("/", (req, res) => {
  let name = req.session.username;
  return new Promise((resolve, reject) => {
    MongoClient.then(() => {
      usersCollection.updateOne(
        { username: name },
        { $push: { favorites: { title: req.body.name, url: req.body.url } } }
      );
    })
      .then(() => {
        console.log("favorite added to db");
        resolve();
      })
      .catch(err => {
        console.log("didnt work" + err);
        reject("something messed up");
      });
  });
});

router.get("/get_data", (req, res) => {
  MongoClient.then(() => {
    var query = { username: req.session.username };
    usersCollection
      .find(query)
      .toArray()
      .then(data => {
        res.json(data[0]);
      });
  }).catch(err => {
    console.log("didnt work" + err);
    reject("something messed up");
  });
});
