/*jshint node: true */
const express = require("express");
const router = express.Router();
const databaseInterface = require("../lib/database");

//get collection of items from database
let items;
databaseInterface((collections) => {
  items = collections.items;
});

//get code that needs to be inputted for login from credentials file
const credentials = require("../credentials.json");

function issueError(res, status, msg, errorItself) {
  //prepend error text
  msg = status + "error: " + msg;

  //log message to console
  console.error(msg);

  //also log error if there was one
  if (errorItself) {
    console.error(errorItself);
  }

  //send given message and status
  res.status(status).send(msg);
}

//ANY all pages must have auth
router.all("*", (req, res, next) => {
  //if a post with the correct code was sent, put it in the session
  if (req.body.code) {
    if (req.body.code === credentials.code) {
      //hereby create session
      req.session.code = req.body.code;
    } else {
      res.render("login", { reason: "code wrong" });
      return;
    }
  }

  //require auth to be correct, show login page otherwise
  if (req.session.code === credentials.code) {
    next();
  } else {
    res.render("login", { reason: "not logged in" });
  }
});

//ANY to the main page, display all the items (ignored anyways)
function indexHandler(req, res) {
  //get everything from db
  items.find({}).toArray().then(data => {
    //if there was any data
    if (data) {
      //render data
      res.render("index", { data: data });
    } else {
      issueError(res, 500, "no data");
    }
  }, (err) => issueError(res, 500, "couldn't get items", err));
}

//on get and post
router.get("/", indexHandler);
router.post("/", indexHandler);

//POST item in/out endpoint
router.post("/update", (req, res) => {
  //need to have either "in" or "out"
  if (req.body.direction === "in" || req.body.direction === "out") {
    //make object to add to in or out
    const adderSetObj = {};
    adderSetObj[req.body.direction] = parseInt(req.body.amount, 10);

    //update in db
    items.updateOne({ name: req.body.name }, {
      $add: adderSetObj,
      $set: { disabled: false }
    }).then(data => {
      //check for ok response
      if (data) {
        res.send("ok");
      } else {
        //didn't find, idk if this makes sense
        issueError(res, 400, "item invalid");
      }
    }, (err) => issueError(res, 500, "couldn't get items", err));
  } else {
    issueError(res, 400, "incorrect direction specified");
  }
});

//POST add item name
router.post("/create", (req, res) => {
  //insert in db
  items.insertOne({
    name: req.body.name,
    in: 0,
    out: 0,
    disabled: false
  }).then(data => {
    //check for ok response
    if (data) {
      res.redirect("/");
    } else {
      //didn't set, idk if this makes sense
      issueError(res, 400, "problem inserting");
    }
  }, () => res.redirect("/"));
});

//POST disable item (not remove, only make grey)
router.post("/disable", (req, res) => {
  //update in db
  items.updateOne({ name: req.body.name }, {
    //set to be disabled
    $set: { disabled: true }
  }).then(data => {
    //check for ok response
    if (data) {
      res.send("ok");
    } else {
      //didn't set, idk if this makes sense
      issueError(res, 400, "problem disabling");
    }
  }, (err) => issueError(res, 500, "couldn't disable item", err));
});

//GET to logout
router.get("/logout", (req, res) => {
  //destroy session and display login page
  req.session.destroy((err) => {
    if (err) {
      console.log(err);
    }
    res.render("login", { reason: err ? "logout failed" : "logout complete"});
  });
});

module.exports = router;
