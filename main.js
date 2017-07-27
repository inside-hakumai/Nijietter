"use strict";
let TwitterStream = require(__dirname + '/lib/twitter.js');

new TwitterStream().stream(function(status){
   console.log(status);
});