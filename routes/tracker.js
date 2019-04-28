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

  // console.log(res.data.items[0].id.videoId);
  // console.log(res.data.items);
}

const scopes = ["https://www.googleapis.com/auth/youtube"];

router.get("/", (req, res) => {
  res.render("tracker");
});

router.post("/", (req, res) => {
  let promise = new Promise((resolve, reject) => {
    let search = req.body.message;
    runSample(search)
      .then(data => {
        console.log(data);
        res.redirect(303, req.baseUrl);
        resolve(data);
      })
      .catch(err => {
        console.log(err);
      });
  });
});