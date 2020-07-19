const {argv} = require('yargs');
const {seedFile} = require('./seed-database');
const {MongoClient, Server} = require('mongodb');
const fs = require('fs');

var client = new MongoClient(new Server('localhost',27017));
client.connect(function (mongoError, mongoClient) {
  if (mongoError) {
    console.log(mongoError)
    return;
  }
  var post = JSON.parse(fs.readFileSync(argv.path));
  let collection = mongoClient.db('blog').collection('posts');
  collection.insertOne(post);
  console.log('finished');
});