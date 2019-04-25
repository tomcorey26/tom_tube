require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

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

app.set("port", process.env.PORT || 3000);

app.use(express.static("public"));

app.get("/", function(req, res) {
  res.render("home");
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
