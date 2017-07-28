let Botkit = require('botkit');
let os = require('os');
let fs = require('fs');
let Logger = require(__dirname + '/logger.js');

let logger_sb = new Logger('slack_bot');


class SlackBot {

   constructor(){
      if (!process.env.SLACK_OAUTH_ACCESS_TOKEN) {
         console.log('Error: Specify token in environment');
         process.exit(1);
      }
      this.controller = Botkit.slackbot();
      this.bot = this.controller.spawn({
         token: process.env.SLACK_OAUTH_ACCESS_TOKEN
      }).startRTM();
   }

   upload_image(filePath, status, mediaStatus){
      let comment = `Post by ${status.user_name}(@${status.user_screen_name}) at ${toLocaleString(status.tweet_time)}`
         + '\n--------------------------------------------\n'
         + `${status.tweet_text}`;

      const messageObj = {
         file: fs.createReadStream(filePath),
         filename: mediaStatus.media_id_str + '.jpg',
         title: mediaStatus.media_id_str,
         channels: process.env.SLACK_CHANNEL_ID,
         initial_comment: comment
      };

      this.bot.api.files.upload(messageObj, function(err, res){
         /*
         if(err){
            console.log(err);
         }
         */
      });

   }

}

module.exports = SlackBot;

function formatUptime(uptime) {
   let unit = 'second';
   if (uptime > 60) {
      uptime = uptime / 60;
      unit = 'minute';
   }
   if (uptime > 60) {
      uptime = uptime / 60;
      unit = 'hour';
   }
   if (uptime !== 1) {
      unit = unit + 's';
   }

   uptime = uptime + ' ' + unit;
   return uptime;
}

function toLocaleString( date ){
   return [
         date.getFullYear(),
         date.getMonth() + 1,
         date.getDate()
      ].join( '-' ) + ' '
      + date.toLocaleTimeString();
}
