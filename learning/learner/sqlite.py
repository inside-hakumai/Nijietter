import sqlite3
import MeCab
import re


class Database:

    def __init__(self, db_path="../store/data.db"):
        self.db_path = db_path
        self.conn = sqlite3.connect(db_path)
        self.cursor = None
        self.mecab = MeCab.Tagger('-d /usr/local/lib/mecab/dic/mecab-ipadic-neologd')

    def get_all_word_appearance(self):
        self.open_cursor()
        words = []
        self.cursor.execute("SELECT * from nijie_bool")
        bool_list = self.cursor.fetchall()
        for row in bool_list:
            self.cursor.execute("SELECT tweet_text from tweet WHERE media_id = ?", [row[0]])
            tweet = self.cursor.fetchone()[0]
            # print("{}, {}, {}".format(row[0], str(row[1]), tweet))

            tweet = re.sub(r'http(s)?://([\w-]+\.)+[\w-]+(/[-\w ./?%&=]*)?', '', tweet)

            self.mecab.parse('')  # 文字列がGCされるのを防ぐ
            node = self.mecab.parseToNode(tweet)
            while node:
                if node.feature.split(",")[0] == '名詞' or node.feature.split(",")[0] == '動詞':
                    word = node.surface
                    # print('{}'.format(word))
                    words.append(word)
                node = node.next
        self.close_cursor()

        return words

    def get_all_user_appearance(self):
        self.open_cursor()
        self.cursor.execute("SELECT user_id FROM "
                            "(SELECT user_id, is_nijie FROM image "
                            "INNER JOIN nijie_bool ON nijie_bool.media_id = image.media_id) "
                            "WHERE is_nijie is NOT NULL")
        data = self.cursor.fetchall()
        users = list(map(lambda t: t[0], data))
        self.close_cursor()

        return users

    def get_bool_and_tweet(self):
        self.open_cursor()
        tuples = []

        self.cursor.execute("SELECT is_nijie, tweet_text FROM tweet "
                            "INNER JOIN nijie_bool on nijie_bool.media_id = tweet.media_id")
        data = self.cursor.fetchall()

        for row in data:
            tweet = re.sub(r'http(s)?://([\w-]+\.)+[\w-]+(/[-\w ./?%&=]*)?', '', row[1])

            words = []
            self.mecab.parse('')  # 文字列がGCされるのを防ぐ
            node = self.mecab.parseToNode(tweet)
            while node:
                if node.feature.split(",")[0] == '名詞' or node.feature.split(",")[0] == '動詞':
                    word = node.surface
                    # print('{}'.format(word))
                    words.append(word)
                node = node.next
            tuples.append([row[0], words])
        self.close_cursor()

        return tuples

    def get_bool_and_user(self):
        self.open_cursor()
        tuples = []

        self.cursor.execute("SELECT is_nijie, user_id FROM "
                            "(SELECT user_id, is_nijie FROM image "
                            "INNER JOIN nijie_bool ON nijie_bool.media_id = image.media_id) "
                            "WHERE is_nijie is NOT NULL")
        data = self.cursor.fetchall()
        self.close_cursor()

        return data

    def get_bool_user_tweet(self):
        self.open_cursor()
        tuples = []

        self.cursor.execute("SELECT is_nijie, user_id, tweet_text FROM"
                            "(SELECT is_nijie, user_id, tweet_text FROM image "
                            "INNER JOIN nijie_bool ON nijie_bool.media_id = image.media_id "
                            "INNER JOIN tweet ON tweet.media_id = image.media_id)"
                            "WHERE is_nijie is NOT NULL")
        data = self.cursor.fetchall()

        for row in data:
            tweet = re.sub(r'http(s)?://([\w-]+\.)+[\w-]+(/[-\w ./?%&=]*)?', '', row[2])

            words = []
            self.mecab.parse('')  # 文字列がGCされるのを防ぐ
            node = self.mecab.parseToNode(tweet)
            while node:
                if node.feature.split(",")[0] == '名詞' or node.feature.split(",")[0] == '動詞':
                    word = node.surface
                    # print('{}'.format(word))
                    words.append(word)
                node = node.next
            tuples.append([row[0], row[1], words])

        self.close_cursor()

        return tuples

    def open_cursor(self):
        self.cursor = self.conn.cursor()

    def close_cursor(self):
        self.cursor.close()
