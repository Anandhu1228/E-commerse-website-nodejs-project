const { MongoClient } = require("mongodb");

let dbConnection;
const mongoURI = "moxxxdb+srv://xxxxxxxx18:Gxxxxxxxxxxping.bmofpky.moxxxxb.net/?rxxxxxes=true&w=maxxxxty";

module.exports = {
  connectToDb: (cb) => {
    MongoClient.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
      .then((client) => {
        dbConnection = client.db();
        return cb();
      })
      .catch((err) => {
        console.log(err);
        return cb(err);
      });
  },
  getDb: () => dbConnection,
};
