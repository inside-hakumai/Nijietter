require('dotenv').config();
let express = require('express');
let router = express.Router();

/* GET home page. */
router.get('/', function (req, res, next) {
   if (req.isAuthenticated()) {
      // console.log(req.user._json);
      if (req.user.id === process.env.APP_ADMIN_TWITTER_ACCOUNT) {
         res.render('index-logged-in-admin', {
            name: req.user._json.name,
            screen_name: req.user._json.screen_name,
            profile_image_url: req.user._json.profile_image_url
         });
      } else {
         res.render('index-logged-in', {
            name: req.user._json.name,
            screen_name: req.user._json.screen_name,
            profile_image_url: req.user._json.profile_image_url
         });
      }
   } else {
      res.render('index');
   }
});

module.exports = router;
