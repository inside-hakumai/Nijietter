# -+*- coding: utf-8 -*-

import os
import json
from typing import List

FILE_DIR = os.path.dirname(os.path.abspath(__file__))


class Resource:

    def __init__(self, config_path=FILE_DIR+"/../config.json"):
        self.config_path = config_path
        file = open(self.config_path, "r")
        self.config = json.load(file)
        file.close()

    def get_twitter_consumer_key(self) -> str :
        return self.config["twitter_consumer_key"]

    def get_twitter_consumer_secret(self) -> str:
        return self.config["twitter_consumer_secret"]

    def get_twitter_access_token(self) -> str:
        return self.config["twitter_access_token"]

    def get_twitter_access_token_secret(self) -> str:
        return self.config["twitter_access_token_secret"]

    def get_collect_delay(self) -> List[int]:
        return self.config["collect_delay"]

    def get_collect_db_path(self) -> str:
        return self.config["collect_db_path"]
