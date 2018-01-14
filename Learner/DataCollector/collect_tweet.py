import signal
from datetime import datetime
import os
import sys
import tweepy
import pprint
from Learner.Resource import Resource
from Learner.DataCollector import TweetDB, ReactionDB
import threading
from time import sleep
import time
import datetime
from dateutil import tz
from typing import List
# from nijietter import Storing
# from nijietter import get_module_logger
# from nijietter.model import ensure_original_from_retweet
# from nijietter.slack import SlackApp
# from nijietter.sqlite import Database
# from tools.hierarchic_logger import HierarchicLog
CWD = os.getcwd()
FILE_DIR = os.path.dirname(os.path.abspath(__file__))

resource = Resource(FILE_DIR + "/../config.json")
tweet_db = TweetDB(FILE_DIR + "/../data/tweet.db")
reaction_db = ReactionDB(FILE_DIR + "/../data/tweet.db")

consumer_key = resource.get_twitter_consumer_key()
consumer_secret = resource.get_twitter_consumer_secret()
access_token = resource.get_twitter_access_token()
access_token_secret = resource.get_twitter_access_token_secret()

auth = tweepy.OAuthHandler(consumer_key, consumer_secret)
auth.set_access_token(access_token, access_token_secret)

api = tweepy.API(auth)

from_zone = tz.gettz('UTC')
to_zone = tz.gettz('Asia/Tokyo')


def on_sigint(_signal, _frame):
    if myStream.running:
        myStream.disconnect()

    sys.exit(0)


pp = pprint.PrettyPrinter(indent=4)
# logging.setLoggerClass(HierarchicLogger)
# logger = get_module_logger()
# db = Database('./store/data.db')


def ensure_original_from_retweet(status):
    if 'retweeted_status' in dir(status):
        return status.retweeted_status
    else:
        return status


def get_reaction_count(delay_second: List[int], status) -> List[dict]:

    return_reaction_data = []

    post_id = status.id_str
    post_at = status.created_at.replace(tzinfo=from_zone).astimezone(to_zone)
    dt_now  = datetime.datetime.now(to_zone)

    delay_max_value = max(delay_second)
    sec_diff = (dt_now - post_at).total_seconds()

    if sec_diff > delay_max_value:
        print("[REAC] {id} -> like:{lc}, retweet:{rc} at {difsec}s ago ({time})".format(id=post_id, lc=status.favorite_count, rc=status.retweet_count, time=dt_now, difsec=(dt_now - post_at).total_seconds()))
        return_reaction_data.append({
            "count_at": dt_now,
            "like_count": status.favorite_count,
            "retweet_count": status.retweet_count
        })
    else:
        delay_second.sort()
        for dsec in delay_second:
            dt_now  = datetime.datetime.now(to_zone)
            sec_diff = (dt_now - post_at).total_seconds()
            if sec_diff < dsec:
                print("[REAC] Wait {sec} seconds for {id} ".format(sec=(dsec-sec_diff), id=post_id))
                sleep(dsec - sec_diff)
                status = api.get_status(post_id)
                dt_now = datetime.datetime.now(to_zone)
                print("[REAC] {id} -> like:{lc}, retweet:{rc} at {difsec}s ago ({time})".format(id=post_id, lc=status.favorite_count, rc=status.retweet_count, time=dt_now, difsec=(dt_now - post_at).total_seconds()))
                return_reaction_data.append({
                    "count_at": dt_now,
                    "like_count": status.favorite_count,
                    "retweet_count": status.retweet_count
                })

    return return_reaction_data


def insert_reaction_counts(post_id: str, delay_second: List[int], status):
    reaction_data = get_reaction_count(delay_second, status)

    for rdata in reaction_data:
        reaction_db.insert_reaction(post_id, rdata["count_at"], rdata["like_count"], rdata["retweet_count"])


def has_extended_entities(status):
    if "extended_tweet" in dir(status):
        status = status.extended_tweet

    return "extended_entities" in dir(status)


# override tweepy.StreamListener to add logic to on_status
class MyStreamListener(tweepy.StreamListener):

    def __init__(self):
        tweepy.StreamListener.__init__(self)
        # self.storing = Storing(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'store'))
        # self.slack_bot = SlackApp()

    def on_status(self, status):

        # storing.save(status)
        status = ensure_original_from_retweet(status)

        # pp.pprint(status)
        # pp.pprint(vars(status))
        # logger.raise_hier_level('debug')
        # logger.debug('START - MyStreamListerner.on_status')
        # self.storing.log_status_detail(tweet_status)
        # save_paths = self.storing.save_if_has_media(tweet_status)

        if has_extended_entities(status):
            print("[POST] {id} at {time} by @{name} - has media".format(id=status.id_str, name=status.user.name, time=status.created_at.replace(tzinfo=from_zone).astimezone(to_zone)))
            tweet_db.insert_tweet(status.id_str, status._json)
            # print(status.text)
            # print(status)
            # print(get_like_count(resource.get_collect_delay(), status))
            th_irc = threading.Thread(target=insert_reaction_counts, name="th_irc", args=(status.id_str, resource.get_collect_delay(), status))
            th_irc.start()
        else:
            print("[POST] {id} at {time} by @{name} - no media".format(id=status.id_str, name=status.user.name, time=status.created_at.replace(tzinfo=from_zone).astimezone(to_zone)))


if __name__ == "__main__":

    myStream = tweepy.Stream(auth=api.auth, listener=MyStreamListener())

    signal.signal(signal.SIGINT, on_sigint)

    # myStream.filter(track=['python'])
    myStream.userstream()
