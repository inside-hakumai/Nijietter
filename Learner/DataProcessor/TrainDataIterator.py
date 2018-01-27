import random
import json
import re
from Learner.DataProcessor.Entry import Entry
entry_db = Entry()


class TrainDataIterator:

    def __init__(self, shuffle=False, reaction_interval=120, interval_tolerance=10):
        self.tweets = entry_db.get_labeled_reacted_tweet(reaction_interval, interval_tolerance)
        self.order = list(range(len(self.tweets)))
        self.current = 0
        if shuffle:
            random.shuffle(self.order)

    def __iter__(self):
        return self

    def __next__(self):
        if self.current == len(self.order):
            raise StopIteration()
        ret_value = list(self.tweets[self.order[self.current]])
        ret_value[1] = extract_tweet_text(ret_value[1])
        self.current += 1
        return ret_value


url_regex = r"(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?"


def extract_tweet_text(tweet_json, remove_url=True):
    text = json.loads(tweet_json)["text"]
    if remove_url:
        text = re.sub(url_regex, "", text)
    return text


if __name__ == "__main__":
    tdi = TrainDataIterator()

    for value in tdi:
        print(value)
