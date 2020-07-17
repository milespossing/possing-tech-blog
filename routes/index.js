var express = require('express');
var router = express.Router();
const {ApiClient} = require('../modules/BlogApi');
const {GetClient} = require('../modules/MongoConnection');

/* GET home page. */
router.get('/', async function(req, res, next) {
  let client = GetClient();
  let api = new ApiClient(client);
  let posts = await api.get_posts();
  res.render('index', { title: 'Possing Technology Blog', subtitle: 'Just a <span class="text-primary">Blog</span> for just regular nerds', articles: posts, image: '/images/home.jpeg'});
});

module.exports = router;