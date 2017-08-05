let express = require('express');
let router = express.Router();

/* GET home page. */
router.get('/', function (req, res, next) {
   if (req.isAuthenticated()) {
      res.render('index-logged-in');
   } else {
      res.render('index');
   }
});

module.exports = router;
