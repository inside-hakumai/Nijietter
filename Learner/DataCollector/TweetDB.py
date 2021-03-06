# -*- coding: utf-8 -*-

import os
import sqlite3
import json
from Learner.Resource import Resource
from contextlib import closing
from datetime import datetime

FILE_DIR = os.path.dirname(os.path.abspath(__file__))
resource = Resource(FILE_DIR + "/../config.json")


class TweetDB:

    def __init__(self, db_path=resource.get_collect_db_path()):
        self.db_path = db_path

        with closing(sqlite3.connect(self.db_path)) as conn:
            c = conn.cursor()

            # executeメソッドでSQL文を実行する
            create_table = "CREATE TABLE IF NOT EXISTS tweets (id VARCHAR PRIMARY KEY, json JSON)"
            c.execute(create_table)
            conn.commit()

    def insert_tweet(self, post_id: str, json_dict: dict):
        with closing(sqlite3.connect(self.db_path)) as conn:
            c = conn.cursor()

            sql = 'INSERT OR IGNORE INTO tweets (id, json) values (?,?)'
            user = (post_id, json.dumps(json_dict))
            c.execute(sql, user)
            conn.commit()

    def get_tweet(self, batchsize: int, index: int):
        with closing(sqlite3.connect(self.db_path)) as conn:
            c = conn.cursor()

            sql = 'SELECT * FROM tweets LIMIT ? OFFSET ?'
            params = (batchsize, batchsize*index)
            c.execute(sql, params)
            return c.fetchall()


class ReactionDB:

    def __init__(self, db_path=resource.get_collect_db_path()):
        self.db_path = db_path

        with closing(sqlite3.connect(self.db_path)) as conn:
            c = conn.cursor()

            # executeメソッドでSQL文を実行する
            create_table = "CREATE TABLE IF NOT EXISTS reactions (id VARCHAR, time VARCHAR, fav INTEGER, retweet INTEGER)"
            c.execute(create_table)
            conn.commit()

    def insert_reaction(self, post_id: str, time: datetime, fav: int, retweet: int):
        with closing(sqlite3.connect(self.db_path)) as conn:
            c = conn.cursor()

            sql = 'INSERT INTO reactions (id, time, fav, retweet) values (?,?,?,?)'
            user = (post_id, time.strftime("%a %b %d %H:%M:%S %z %Y"), fav, retweet)
            c.execute(sql, user)
            conn.commit()


class LabelDB:

    def __init__(self, db_path=resource.get_collect_db_path()):
        self.db_path = db_path

        with closing(sqlite3.connect(self.db_path)) as conn:
            c = conn.cursor()

            # executeメソッドでSQL文を実行する
            create_table = "CREATE TABLE IF NOT EXISTS labels (id VARCHAR PRIMARY KEY, label INTEGER DEFAULT -1)"

            c.execute(create_table)
            conn.commit()

    def insert_label(self, post_id: str, label: int):
        ret_val = None
        with closing(sqlite3.connect(self.db_path)) as conn:
            c = conn.cursor()

            sql = 'INSERT OR REPLACE INTO labels (id, label) values (?,?)'
            data = (post_id, label)

            try:
                c.execute(sql, data)
                conn.commit()
            except:
                import traceback
                traceback.print_exc()
                ret_val = False

        ret_val = True
        return ret_val
