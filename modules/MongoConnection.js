const {MongoClient,Server} = require('mongodb');

var client = undefined;

exports.Initialize = function(host,port){
  client = new MongoClient(new Server(host,port));
  client.connect()
}

exports.GetClient = () => client;