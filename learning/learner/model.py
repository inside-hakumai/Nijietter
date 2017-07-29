import codecs
import json
import os
import random
from collections import Counter

import h5py
import numpy as np

from learner.sqlite import Database


class LM:
    def __init__(self, db_path=None, threshold=2, loop=200):
        self.dictionary = dict()  # { token: index, ... }
        self.index2word = []  # [token, token, token, ... ]
        self.wordScore = None  # [float, float, float ... ]
        self.threshold = threshold
        self.count = []
        self.loop = loop

        if db_path is not None:
            self.prepare_vocabulary()
            self.initialize()
            self.train()
            self.save()

    def prepare_vocabulary(self):
        print("Preparing vocabulary...")

        db = Database()
        words = db.get_all_words()

        print('#Word appearance:           {}'.format(len(words)))

        count = 0
        words_unique = []
        counter = Counter(words)
        print('#Unique words:              {}'.format(len(counter)))

        excluded_words = 0
        for k, v in counter.items():
            if v >= self.threshold:
                words_unique.append(k)
                count += v
            else:
                excluded_words += 1

        print('#Excluded unique words:     {}'.format(excluded_words))
        print('#Remaining unique words:    {}'.format(len(words_unique)))
        print('#Remaining word appearance: {}'.format(count))

        index2word = words_unique

        dictionary = {}
        for i, w in enumerate(index2word):
            dictionary[w] = i

        self.count = count
        self.dictionary = dictionary
        self.index2word = index2word

        write_json("count.json", self.count)
        write_json("dict.json", self.dictionary)
        write_json("index2word.json", self.index2word)

    def initialize(self):
        self.wordScore = np.random.rand(len(self.dictionary)).astype(np.float32)
        write_json('initial_word_score.json', self.wordScore.tolist())

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
                    indexes = map(lambda x: self.dictionary.get(x, None), words)
                    if is_nijie:
                        for index in indexes:
                            if index is not None:
                                self.wordScore[index] = self.wordScore[index] * (1 + learn_rate)
                    else:
                        for index in indexes:
                            if index is not None:
                                self.wordScore[index] = self.wordScore[index] * (1 - learn_rate)

        print ("Training is finished.")


    def save(self):
        print('Saving model...')
        scores = {}
        for i, word in enumerate(self.index2word):
            scores[word] = self.wordScore[i].item()
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

    def load(self, name='model.hdf5'):
        f = h5py.File(name, 'r')
        self.wordScore = f['wordScore'][:]
        self.index2word = f['index2word'][:]


def write_json(filename, data):
    if not os.path.exists("./log"):
        os.makedirs("./log")
    file_path = os.path.join("./log/", filename)
    dump_file = codecs.open(file_path, "w+")
    json.dump(data, dump_file, ensure_ascii=False, indent=3)

    dump_file.close()
    print('Log saved: {}'.format(os.path.abspath(file_path)))


if __name__ == "__main__":
    lm = LM('../store/data.db')
