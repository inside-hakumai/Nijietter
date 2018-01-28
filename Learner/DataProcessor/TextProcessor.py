# -*- coding: utf-8 -*-

import os
import re
import math
import MeCab
import traceback
from Learner.Resource import Resource
from Learner.DataProcessor.Entry import Entry
import sqlite3
from contextlib import closing

FILE_DIR = os.path.dirname(os.path.abspath(__file__))
resource = Resource(FILE_DIR + "/../config.json")
entry_db = Entry()

PARSE_TEXT_ENCODING = 'utf-8'


class TextProcessor:

    def __init__(self, mecab_dict_path=resource.get_mecab_dict_path(), entry_db_path=resource.get_collect_db_path(), train_data_db_path=None):
        self.mc       = MeCab.Tagger(" -d {0}".format(mecab_dict_path))
        self.entry_db = Entry(entry_db_path)
        self.mc.parse("")

        self.train_data_db_path = None
        self.word_weight = {}
        if train_data_db_path:
            self.set_train_data_db(train_data_db_path)

    def set_train_data_db(self, db_path):
        if os.path.exists(db_path):
            self.train_data_db_path = db_path

            with closing(sqlite3.connect(self.train_data_db_path)) as conn:
                c = conn.cursor()
                select_query = "SELECT word, weight FROM words"
                c.execute(select_query)
                for word, weight in c.fetchall():
                    self.word_weight[word] = weight
        else:
            raise FileNotFoundError(db_path)

    def parse_text(self, text):
        # text = text.encode(PARSE_TEXT_ENCODING)
        node = self.mc.parseToNode(text)
        words = []

        while node:
            pos = node.feature.split(",")[0]
            # unicode 型に戻す
            # word = node.surface.decode("utf-8")
            if pos == "名詞" or pos == "動詞" or pos == "形容詞":
                words.append(node.surface)
            node = node.next

        return words

    # カウントではなく評価値
    def count_word_appearance(self):
        tweets = self.entry_db.get_labeled_tweet_text()
        count_dict = {}

        for (text, label) in tweets:
            # text  = tweet[0]
            # label = tweet[1]
            try:
                # print(text)
                text = text.decode("utf-8")
                # print(text)
                text = re.sub('http[s]?://(?:[a-zA-Z]|[0-9]|[$-_@.&+]|[!*\(\),]|(?:%[0-9a-fA-F][0-9a-fA-F]))+', '', text)
                print(text)
                words = self.parse_text(text)
            except:
                traceback.print_exc()

        self.entry_db.set_word_count(count_dict)
        return count_dict

    def get_data_set(self):
        return entry_db.get_labeled_tweet()

    def get_text_eval_value(self, pos_count: int, neg_count: int):
        count = pos_count - neg_count
        if count >= 0:
            return math.log(count+1)
        else:
            return -1 * math.log(abs(count) + 1)


if __name__ == "__main__":

    tp = TextProcessor()
    print(tp.count_word_appearance())


