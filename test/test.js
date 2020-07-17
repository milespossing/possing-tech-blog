const assert = require('assert');
const MongoClient = require('mongodb').MongoClient
  , Server = require('mongodb').Server;

let url = 'mongodb://localhost:27017'
let title = ['My First Test Post','My Second Test Post'];
let shortName = ['test_post','test_2'];
let date = [Date.parse('2020-07-10'), Date.parse('2020-06-10')];
var ids;
var connection;

const mongoClient = new MongoClient(new Server('localhost',27017));

describe('blog api tests', function() {
  before(async function(){
    connection = await mongoClient.connect();
    let {seed} = require('../scripts/seed-database');
    ids = await seed(connection,title,shortName,date);
  });

  it('Can get blog by short name', async function() {
    let {Client} = require('../modules/BlogApi');
    let client = new Client(connection);
    let post = await client.get_post(ids[0]);
    assert.notStrictEqual(post,null);
    assert.notStrictEqual(post, undefined);
    assert.strictEqual(post.title,title[0], 'incorrect title');
    assert.strictEqual(post.date,new Date(date[0]), 'incorrect date');
  });

  it('Can get all posts', async function() {
    let {Client} = require('../modules/BlogApi');
    let client = new Client(connection);
    let posts = await client.get_posts();
    assert.strictEqual(2,posts.length)
  });
})