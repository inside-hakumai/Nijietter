import codecs
import json
import os
from collections import Counter
import numpy as np
from sklearn.svm import SVC
from sklearn.externals import joblib
from learner.sqlite import Database


class Model:
    def __init__(self, db_path=None, threshold=2, loop=200):
        self.word_dictionary = None  # np.array([token, index] [token, index], ... }
        self.word_index2word = None  # np.array([token, token, token, ... ])
        self.word_score = None       # np.array([float, float, float ... ])
        self.user_dictionary = None  # np.array([token, index] [token, index], ... }
        self.user_index2user = None  # np.array([token, token, token, ... ])
        self.user_score = None       # np.array([float, float, float ... ])

        self.threshold = threshold
        self.word_count = []
        self.user_count = []
        self.loop = loop

        self.estimator = None

        if db_path is not None:
            self.prepare_vocabulary()
            self.initialize()
            self.train()
            self.save()

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

        word_dictionary = []
        for i, w in enumerate(index2word):
            word_dictionary.append([w, i])

        self.word_count = word_count
        self.word_dictionary = np.array(word_dictionary)
        self.word_index2word = np.array(index2word)
        
        write_json("word_count.json", self.word_count)
        write_json("word_dict.json", self.word_dictionary.tolist())
        write_json("index2word.json", self.word_index2word.tolist())

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

        user_dictionary = []
        for i, w in enumerate(index2user):
            user_dictionary.append([w, i])

        self.user_count = user_count
        self.user_dictionary = np.array(user_dictionary)
        self.user_index2user = np.array(index2user)

        write_json("user_count.json", self.user_count)
        write_json("user_dict.json", self.user_dictionary.tolist())
        write_json("index2user.json", self.user_index2user.tolist())

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
                indexes = map(lambda x: arr_dict_get(x, self.word_dictionary), words)
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
            user_index = arr_dict_get(user, self.user_dictionary)
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
        data = db.get_bool_user_tweet()

        label_train = []
        user_score_train = []
        tweet_score_train = []

        for label, username, words in data:
            user_score = self.get_score_from_username(username)
            if user_score is not None:
                tweet_score = self.get_words_score_avg(words)
                label_train.append(label)
                user_score_train.append(user_score)
                tweet_score_train.append(tweet_score)
            else:
                continue

        scores_train = []
        for i in range(len(user_score_train)):
            scores_train.append([user_score_train[i], tweet_score_train[i]])

        train_data = []
        for i in range(len(label_train)):
            train_data.append([label_train[i], scores_train[i]])

        write_json('train_data.json', train_data)

        print("Start training...")

        self.estimator = SVC(C=1.0)
        self.estimator.fit(scores_train, label_train)

        print("Training finished.")

        # print(self.estimator.get_params())

        # prediction = self.estimator.predict(scores_train)
        # print(np.array(label_train) == prediction)

    def save(self, model_save_path='model.pkl', arrays_save_path='values.npz'):
        joblib.dump(self.estimator, model_save_path)
        print('Saved model to {}'.format(os.path.abspath(model_save_path)))
        np.savez(arrays_save_path,
                 self.word_dictionary, self.word_index2word, self.word_score,
                 self.user_dictionary, self.user_index2user, self.user_score)
        print('Saved values to {}'.format(os.path.abspath(arrays_save_path)))

    def predict(self, data):
        return self.estimator.predict(data)

    def get_score_from_username(self, username):
        index = arr_dict_get(username, self.user_dictionary)
        if index is not None:
            return self.user_score[index]
        else:
            return None

    def get_words_score_avg(self, words):
        score_sum = 0.0
        words_num = len(words)
        if words_num != 0:
            indexes = map(lambda x: arr_dict_get(x, self.word_dictionary), words)
            for index in indexes:
                if index is not None:
                    score_sum += self.word_score[index]
            avg_score = score_sum / float(words_num)
        else:
            avg_score = 0

        return avg_score


def arr_dict_get(key, array):
    result = np.column_stack(np.where(array == key))
    for row in result:
        if row[1] == 0:
            return row[0]

    return None


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
