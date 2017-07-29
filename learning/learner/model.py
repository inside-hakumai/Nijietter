import codecs
import json
import os
import random
from collections import Counter
import numpy as np

from learner.sqlite import Database


class Model:
    def __init__(self, db_path=None, threshold=2, loop=200):
        self.word_dictionary = {}  # { token: index, ... }
        self.word_index2word = []  # [token, token, token, ... ]
        self.word_score = None  # [float, float, float ... ]
        self.user_dictionary = {}  # { token: index, ... }
        self.user_index2user = []  # [token, token, token, ... ]
        self.user_score = None  # [float, float, float ... ]

        self.threshold = threshold
        self.word_count = []
        self.user_count = []
        self.loop = loop

        if db_path is not None:
            self.prepare_vocabulary()
            self.initialize()
            # self.train()
            # self.save()

    def prepare_vocabulary(self):
        db = Database()

        print("Preparing vocabulary...")

        # prepare word list
        words = db.get_all_word_appearance()

        print('#Word appearance:           {}'.format(len(words)))

        word_count = 0
        words_unique = []
        word_counter = Counter(words)
        print('#Unique words:              {}'.format(len(word_counter)))

        excluded_words = 0
        for k, v in word_counter.items():
            if v >= self.threshold:
                words_unique.append(k)
                word_count += v
            else:
                excluded_words += 1

        print('#Excluded unique words:     {}'.format(excluded_words))
        print('#Remaining unique words:    {}'.format(len(words_unique)))
        print('#Remaining word appearance: {}'.format(word_count))

        index2word = words_unique

        word_dictionary = {}
        for i, w in enumerate(index2word):
            word_dictionary[w] = i

        self.word_count = word_count
        self.word_dictionary = word_dictionary
        self.word_index2word = index2word
        
        write_json("word_count.json", self.word_count)
        write_json("word_dict.json", self.word_dictionary)
        write_json("index2word.json", self.word_index2word)

        # prepare user list
        users = db.get_all_user_appearance()
        print('#User appearance:           {}'.format(len(users)))

        user_count = 0
        users_unique = []
        user_counter = Counter(users)
        print('#Unique users:              {}'.format(len(user_counter)))

        excluded_users = 0
        for k, v in user_counter.items():
            if v >= self.threshold:
                users_unique.append(k)
                user_count += v
            else:
                excluded_users += 1

        print('#Excluded unique users:     {}'.format(excluded_users))
        print('#Remaining unique users:    {}'.format(len(users_unique)))
        print('#Remaining user appearance: {}'.format(user_count))

        index2user = users_unique

        user_dictionary = {}
        for i, w in enumerate(index2user):
            user_dictionary[w] = i

        self.user_count = user_count
        self.user_dictionary = user_dictionary
        self.user_index2user = index2user

        write_json("user_count.json", self.user_count)
        write_json("user_dict.json", self.user_dictionary)
        write_json("index2user.json", self.user_index2user)

    def initialize(self):
        db = Database()

        # calculate word score
        self.word_score = np.zeros(len(self.word_dictionary))
        data_word = db.get_bool_and_tweet()

        for word_tuple in data_word:
            if word_tuple[0] == 1:
                is_nijie = True
            elif word_tuple[0] == 0:
                is_nijie = False
            else:
                continue

            words = word_tuple[1]
            word_num = len(words)

            if len(words) != 0:
                indexes = map(lambda x: self.word_dictionary.get(x, None), words)
                indexes = [v for v in indexes if v is not None]

                if is_nijie:
                    self.word_score[indexes] += 1/word_num
                else:
                    self.word_score[indexes] -= 1/word_num

        scores = []
        for i, word in enumerate(self.word_index2word):
            scores.append((word, self.word_score[i].item()))
        write_json('initial_word_score.json', sorted(scores, key=lambda x: -1*float(x[1])))

        # calculate user score
        self.user_score = np.zeros(len(self.user_dictionary))
        db = Database()
        data_user = db.get_bool_and_user()

        for user_tuple in data_user:
            if user_tuple[0] == 1:
                is_nijie = True
            elif user_tuple[0] == 0:
                is_nijie = False
            else:
                continue

            user = user_tuple[1]
            user_index = self.user_dictionary.get(user, None)
            if user_index is not None:
                if is_nijie:
                    self.user_score[user_index] += 1
                else:
                    self.user_score[user_index] -= 1

        user_scores = []
        for i, user in enumerate(self.user_index2user):
            user_scores.append((user, self.user_score[i].item()))
        write_json('initial_user_score.json', sorted(user_scores, key=lambda x: -1*float(x[1])))

    def train(self):
        db = Database()
        data = db.get_bool_and_tweet()

        print("Start training...")

        for loop_count in range(self.loop):
            iter = loop_count + 1
            print("Iteration: " + str(iter))
            learn_rate = 1 / iter
            random.shuffle(data)

            for tuple in data:
                if tuple[0] == 1:
                    is_nijie = True
                elif tuple[0] == 0:
                    is_nijie = False
                else:
                    continue

                words = tuple[1]
                if len(words) != 0:
                    indexes = map(lambda x: self.word_dictionary.get(x, None), words)
                    if is_nijie:
                        for index in indexes:
                            if index is not None:
                                self.word_score[index] = self.word_score[index] * (1 + learn_rate)
                    else:
                        for index in indexes:
                            if index is not None:
                                self.word_score[index] = self.word_score[index] * (1 - learn_rate)

        print("Training is finished.")

    def save(self):
        print('Saving model...')
        scores = {}
        for i, word in enumerate(self.word_index2word):
            scores[word] = self.word_score[i].item()
        write_json('result_score.json', scores)

        # f = h5py.File('model.hdf5', 'w')
        # f.create_dataset('dictionary', data=self.dictionary)
        # f.create_dataset('wordScore', data=self.wordScore)
        # f.create_dataset('data', data=np.asarray(self.data))
        # f.create_dataset('count', data=self.count)
        # f.create_dataset('index2word', data=np.asarray(self.index2word))
        # f.flush()
        # f.close()
        print('Saved!')


def write_json(filename, data):
    if not os.path.exists("./log"):
        os.makedirs("./log")
    file_path = os.path.join("./log/", filename)
    dump_file = codecs.open(file_path, "w+")
    json.dump(data, dump_file, ensure_ascii=False, indent=3)

    dump_file.close()
    print('Log saved: {}'.format(os.path.abspath(file_path)))


if __name__ == "__main__":
    lm = Model('../store/data.db')
