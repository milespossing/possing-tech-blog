var express = require('express');
var router = express.Router();
const {ApiClient} = require('../modules/BlogApi');
const {GetClient} = require('../modules/MongoConnection')


router.get('/:id', async (req, res) => {
  let id = req.params.id;
  let mongoClient = GetClient();
  let postClient = new ApiClient(mongoClient);
  let post = await postClient.get_post(id);
  post.image = post.image || '/images/home.jpeg'
  res.render('post', post);
});

module.exports = router;