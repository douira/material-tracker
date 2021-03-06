/*jshint node: true */
const express = require("express");
const router = express.Router();
const databaseInterface = require("../lib/database");

//removes completely returned disabled every half hour if odler than 3 hours
function removeOldItems(items) {
  //delete all that are disabled and their timer over the 3 hour threshold
  items.deleteMany({
    disabled: 1, //1 = is disabled
    disableTime: { $lt: Date.now() - 1000 * 60 * 60 * 3 }, //must be older than 3h
    $where: "obj.in >= obj.out"
  });
}

//get collection of items from database
let items;
databaseInterface((collections) => {
  //get items collection
  items = collections.items;

  //run now and in regular intervals
  removeOldItems(items);
  setInterval(removeOldItems.bind(null, items), 1000 * 60 * 10); //every 10 minutes
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
      //order data by disabled state
      data.sort((a, b) => a.disabled - b.disabled || a.name > b.name);

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
      $inc: adderSetObj,
      $set: { disabled: -1 }
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
    disabled: -1
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
    $mul: { disabled: -1 },
    $set: { disableTime: Date.now() }
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
