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


def get_reaction_count(delay_second: int, status):

    post_id = status.id_str
    post_at = status.created_at.replace(tzinfo=from_zone).astimezone(to_zone)
    dt_now  = datetime.datetime.now(to_zone)

    print(post_at)
    print(dt_now)

    sec_diff = (dt_now - post_at).total_seconds()
    print(delay_second - sec_diff)
    print(sec_diff)
    if sec_diff < delay_second:
        sleep(delay_second - sec_diff)
        status = api.get_status(post_id)

    return {
        "count_at": dt_now,
        "like_count": status.favorite_count,
        "retweet_count": status.retweet_count
    }


def insert_reaction_counts(post_id: str, delay_second: int, status):
    reaction_data = get_reaction_count(delay_second, status)
    reaction_db.insert_reaction(post_id, reaction_data["count_at"], reaction_data["like_count"], reaction_data["retweet_count"])


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

        pp.pprint(status)
        # pp.pprint(vars(status))
        # logger.raise_hier_level('debug')
        # logger.debug('START - MyStreamListerner.on_status')
        # self.storing.log_status_detail(tweet_status)
        # save_paths = self.storing.save_if_has_media(tweet_status)

        if has_extended_entities(status):
            tweet_db.insert_tweet(status.id_str, status._json)
            # print(status.text)
            # print(status)
            # print(get_like_count(resource.get_collect_delay(), status))
            th_irc = threading.Thread(target=insert_reaction_counts, name="th_irc", args=(status.id_str, resource.get_collect_delay(), status))
            th_irc.start()
        else:
            print("no media")


if __name__ == "__main__":

    myStream = tweepy.Stream(auth=api.auth, listener=MyStreamListener())

    signal.signal(signal.SIGINT, on_sigint)

    # myStream.filter(track=['python'])
    myStream.userstream()
