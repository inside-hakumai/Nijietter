# -*- coding:utf-8 -*-

# from Learner.Model import Model
import os
import sqlite3
from contextlib import closing
from datetime import datetime
from Learner import Resource
from Learner.DataProcessor import TrainDataIterator
from Learner.DataProcessor import TextProcessor


class Trainer:

    def __init__(self, config_path: str = None):
        self.resource = Resource(config_path) if config_path else Resource()
        self.train_data_iterator = TrainDataIterator()
        self.text_processor = TextProcessor()

        self.output_path = self.resource.get_train_output_path() + "/" + datetime.now().strftime("%y%m%d_%H%M%S")
        os.makedirs(self.output_path, exist_ok=True)

    def prepare_word_weight(self):
        count_dict = {}
        word_weight = []

        for entry in self.train_data_iterator:
            text = entry[1]
            words = self.text_processor.parse_text(text)
            label = int(entry[2])

            for w in words:
                if w not in count_dict:
                    count_dict[w] = []
                    count_dict[w].append(0)
                    count_dict[w].append(0)
                if label == 1:
                    count_dict[w][0] += 1
                else:
                    count_dict[w][1] += 1

        wfunc = self.resource.get_word_weight_function()
        for word, count in count_dict.items():
            word_weight.append((word, count[0], count[1], wfunc(count[0] - count[1])))
        self.report_word_weight(word_weight)

    def report_word_weight(self, weight_data):
        with closing(sqlite3.connect(self.output_path + "/train_result.db")) as conn:
            c = conn.cursor()
            create_query = "CREATE TABLE IF NOT EXISTS words (word VARCHAR(255), pos_count INTEGER, neg_count INTEGER, weight REAL)"
            c.execute(create_query)

            insert_query = "INSERT INTO words(word, pos_count, neg_count, weight) VALUES(?, ?, ?, ?)"
            c.executemany(insert_query, weight_data)

            conn.commit()


if __name__ == "__main__":
    trainer = Trainer()
    trainer.prepare_word_weight()
