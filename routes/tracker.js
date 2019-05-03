const express = require("express");
const router = express.Router();
module.exports = router;
("use strict");
const { google } = require("googleapis");

const youtube = google.youtube({
  version: "v3",
  auth: "AIzaSyA-EHLvPYpJehvaHkrDmfIr21A0cUWtX6A"
});

// a very simple example of searching for youtube videos
async function runSample(searchVal) {
  let results = [];
  const res = await youtube.search.list({
    part: "id,snippet",
    q: searchVal,
    maxResults: 3
  });
  return res.data.items;
}

const scopes = ["https://www.googleapis.com/auth/youtube"];

router.get("/", (req, res) => {
  res.render("tracker", {
    results: req.session.results || []
  });
});

router.post("/", (req, res) => {
  let promise = new Promise((resolve, reject) => {
    let search = req.body.message;
    req.session.results = [];
    runSample(search)
      .then(data => {
        resolve(data);
      })
      .catch(err => {
        console.log(err);
      });
  })
    .then(data => {
      req.session.results = data;
      // results = data;
    })
    .catch(err => {
      console.error(err);
    })
    .finally(() => {
      //if the request is from jquerey then send back data
      if (req.xhr) {
        res.json(req.session.results);
      } else {
        res.redirect(303, req.baseUrl);
      }
    });
  // results = promise;
});

router.get("/watch", (req, res) => {
  res.render("watch", { query: req.query });
});
