let Log4js = require('log4js');

Log4js.configure({
   appenders: {
      console: { type: 'console'},
      file_store: { type: 'file', filename: __dirname + '/../log/file_store.log'},
      slack_bot: { type: 'file', filename: __dirname + '/../log/slack_bot.log'},
      sqlite: { type: 'file', filename: __dirname + '/../log/sqlite.log'},
      learning: { type: 'file', filename: __dirname + '/../log/learning.log'},
      app_main: { type: 'file', filename: __dirname + '/../log/app.log' },
      app_estimator: { type: 'file', filename: __dirname + '/../log/app_estimator.log'},
      app_twstream: { type: 'file', filename: __dirname + '/../log/app_twstream.log'},
      app_sqlite: { type: 'file', filename: __dirname + '/../log/app_sqlite.log'},
   },
   categories: {
      default: { appenders: ['console'], level: 'debug' },
      file_store: { appenders: ['file_store'], level: 'debug' },
      slack_bot: { appenders: ['slack_bot'], level: 'debug', replaceConsole: true },
      sqlite: { appenders: ['console', 'sqlite'], level: 'debug'},
      learning: { appenders: ['console', 'learning'], level: 'debug'},
      app_main: { appenders: ['console', 'app_main'], level: 'debug'},
      app_estimator: { appenders: ['console', 'app_estimator'], level: 'debug'},
      app_twstream: {appenders: ['console', 'app_twstream'], level: 'debug'},
      app_sqlite: {appenders: ['console', 'app_sqlite'], level: 'debug'},
   }
});

levelName = [
   'FATAL', 'fatal',
   'ERROR', 'error',
   'WARN', 'warn',
   'INFO', 'info',
   'DEBUG', 'debug',
];

class HierarchicLogger {

   constructor(loggerName='default', bc_char='+', ec_char='+', h_char='-', v_char='| ', length=60){
      this.logger = Log4js.getLogger(loggerName);
      this.hier_level = 0;
      this.border_begin_corner = bc_char;
      this.border_end_corner = ec_char;
      this.border_h_char = h_char;
      this.border_v_char = v_char;
      this.border_length = length
   }

   raiseHierLevel(level=null){
      if(level) {
         if (levelName.includes(level)){
            let lvl = level.toLowerCase();
            this.log(lvl, this.get_start_border(this.hier_level))
         } else {
            throw Error(`Invalid level name: ${level} `);
         }
      }
      this.hier_level++;
   }

   dropHierLevel(level=null) {
      if (this.hier_level === 0) {
         throw Error(`Invalid hierarchy level: ${level}`);
      } else {
         this.hier_level--;
         if (level) {
            if (levelName.includes(level)) {
               let lvl = level.toLowerCase();
               this.log(lvl, this.get_end_border(this.hier_level, this.hier_level === 0))
            } else {
               throw Error(`Invalid hierarchy level: ${level}`);
            }
         }
      }
   }

   get_start_border(level, break_after=false) {
      let border_text = this.border_begin_corner + (new Array(this.border_length - (level + 1)).join(this.border_h_char));
      if (break_after) {
         return border_text + '\n';
      } else {
         return border_text;
      }
   }

   get_end_border(level, break_after=false) {
      let border_text = this.border_end_corner + (new Array(this.border_length - (level + 1)).join(this.border_h_char));
      if (break_after) {
         return border_text + '\n';
      } else {
         return border_text;
      }
   }

   join_border_to_msg(border_num, msg) {
      if (border_num === 0) {
         return msg;
      } else if (border_num === 1) {
         return this.border_v_char + msg;
      } else if (border_num > 1) {
         return this.join_border_to_msg(border_num - 1, this.border_v_char + msg);
      } else {
         throw Error(`Invalid border number: ${border_num}`);
      }
   }

   fatal(message){
      let msg_lines = message.toString().split('\n');
      msg_lines.forEach(function(line){
         let msg = this.join_border_to_msg(this.hier_level, line);
         this.logger.fatal(msg);
      }, this);
   }

   error(message){
      let msg_lines = message.toString().split('\n');
      msg_lines.forEach(function(line){
         let msg = this.join_border_to_msg(this.hier_level, line);
         this.logger.error(msg);
      }, this);
   }

   warn(message){
      let msg_lines = message.toString().split('\n');
      msg_lines.forEach(function(line){
         let msg = this.join_border_to_msg(this.hier_level, line);
         this.logger.warn(msg);
      }, this);
   }

   info(message){
      let msg_lines = message.toString().split('\n');
      msg_lines.forEach(function(line){
         let msg = this.join_border_to_msg(this.hier_level, line);
         this.logger.info(msg);
      }, this);
   }

   debug(message){
      let msg_lines = message.toString().split('\n');
      msg_lines.forEach(function(line){
         let msg = this.join_border_to_msg(this.hier_level, line);
         this.logger.debug(msg);
      }, this);
   }

   log(level, message){
      switch(level){
         case 'fatal':
            this.fatal(message);
            break;
         case 'error':
            this.error(message);
            break;
         case 'warn':
            this.warn(message);
            break;
         case 'info':
            this.info(message);
            break;
         case 'debug':
            this.debug(message);
            break;
         default:
            throw Error(`Invalid level name: ${level}`);
            break;
      }
   }
}

module.exports = HierarchicLogger;
