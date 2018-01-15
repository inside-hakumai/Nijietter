#!/usr/bin/env python
# -*- coding: utf-8 -*-

import os
import cgi
from Learner.Resource import Resource
from Learner.DataCollector.TweetDB import TweetDB

FILE_DIR = os.path.dirname(os.path.abspath(__file__))
resource = Resource(FILE_DIR + "/../../config.json")
db       = TweetDB(resource.get_collect_db_path())

ret_data = db.get_tweet(10, 0)

print(ret_data)
