# -*- coding: utf-8 -*-

import os
import sqlite3
import json
from Resource import Resource
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

            sql = 'INSERT INTO tweets (id, json) values (?,?)'
            user = (post_id, json.dumps(json_dict))
            c.execute(sql, user)
            conn.commit()


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