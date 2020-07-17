const {seedFile} = require('./seed-database');
const {MongoClient} = require('mongodb');

MongoClient.connect('mongodb://localhost:27017',{useUnifiedTopology: true},(err,connection) => {
  seedFile(connection,'scripts/simple-seed.json');
  console.log('finished');
});