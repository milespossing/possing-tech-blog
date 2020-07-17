const {ObjectID} = require('mongodb');
const dateTimeFormat = new Intl.DateTimeFormat('en', { year: 'numeric', month: 'short', day: '2-digit' });

exports.ApiClient = class {
  constructor(mongoConnection) {
    this.connection = mongoConnection;
  }

  async get_post(id){
    let posts = this.connection.db('blog').collection('posts');
    let fromHexString = ObjectID.createFromHexString(id);
    let post = await posts.findOne(fromHexString);
    return post;
  }

  async get_post_by_shortname(shortName){
    let posts = this.connection.db('blog').collection('posts');
    let output = await posts.findOne({shortName: shortName}, doc => {
      this.clean_post(doc);
    });
    return output;
  }

  get_posts(){
    let collection = this.connection.db('blog').collection('posts');
    return collection
      .find()
      .sort({date:-1})
      .toArray()
      .then(posts => {
        return posts;
      });
  }
}
