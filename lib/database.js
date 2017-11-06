/*jshint esversion: 6, node: true */
const mongo = require("mongodb");

//callbacks to call on loading of db
const callbackOnLoad = [];

//connect to mongodb
const connectPromise = mongo.connect("mongodb://localhost:27017/material-tracker")
  .then((db) => {
    //init indexes on collections
    db.collection("items").createIndex({ name: "text" });

    //get collections of database
    db.listCollections().toArray((err, collInfos) => {
      if (err) {
        throw err;
      }

      //map to collections
      const collections = {};
      collInfos.forEach((info) => collections[info.name] = db.collection(info.name));

      //call callacks on connection established
      callbackOnLoad.forEach((c) => c(collections, db));
    });
  }, (err) => console.error("db connect error", err));


//adds to list of load callbacks
module.exports = c => {
  //push item if given
  if (c) {
    callbackOnLoad.push(c);
  }

  //return database promise
  return connectPromise;
};

