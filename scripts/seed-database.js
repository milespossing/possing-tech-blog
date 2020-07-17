const {MongoClient} = require('mongodb');
const fs = require('fs');

exports.seed = async function(connection,title,shortName,date){
  console.log('seeding');
  let dbo = connection.db('blog');
  let collection = dbo.collection('posts');
  let output = [];
  await collection.removeMany();
  for (let i = 0; i < 2; i++){
    let id = await collection.insertOne({title: title[i], shortName: shortName[0], body: '<h1>test body</h1>', date: date[0]});
    output.push(id.insertedId.toString());
  }
  return output;
}

exports.seedFile = function(connection,file){
  let dbo = connection.db('blog');
  let collection = dbo.collection('posts');
  collection.removeMany();
  let data = fs.readFileSync(file);
  let parsed = JSON.parse(data);
  parsed.posts.forEach(post => {
    collection.insertOne(post);
  });
}
