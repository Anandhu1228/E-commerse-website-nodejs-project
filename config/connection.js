const { MongoClient } = require("mongodb");

let dbConnection;
const mongoURI = "mongodb+srv://anandhumohan2018:GOSDESATcloud@shopping.bmofpky.mongodb.net/?retryWrites=true&w=majority";

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