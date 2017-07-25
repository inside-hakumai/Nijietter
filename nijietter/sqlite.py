import sqlite3
from nijietter import get_module_logger


class Database:

    def __init__(self, dbname):
        self.dbname = dbname
        self.connection = sqlite3.connect(self.dbname)
        self.cursor = self.connection.cursor()
        self.logger = get_module_logger()

        self.cursor.execute('CREATE TABLE IF NOT EXISTS slackpost '
                            '(id INTEGER PRIMARY KEY, '
                            'slack_file_id TEXT, slack_post_ts TEXT, media_id TEXT, user_id TEXT, deleted INTEGER)')

    def commit(self):
        self.connection.commit()

    def close(self):
        self.connection.close()

    def add_entry(self, slack_file_id, slack_post_ts, media_id, user_id):
        self.logger.raise_hier_level('debug')
        self.logger.debug('START - Database.add_entry')
        self.cursor.execute('INSERT INTO slackpost(slack_file_id, slack_post_ts, media_id, user_id) VALUES(?, ?, ?, ?)',
                            (slack_file_id, slack_post_ts, media_id, user_id))
        self.commit()
        self.logger.debug('END - Database.add_entry')
        self.logger.drop_hier_level('debug')


if __name__ == '__main__':
    db = Database('../store/data.db')
