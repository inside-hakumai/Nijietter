import signal
from datetime import datetime
import os
import sys
import tweepy
import pprint
from nijietter import Storing
from nijietter import get_module_logger
from nijietter.model import ensure_original_from_retweet
from nijietter.slack import SlackApp
from nijietter.sqlite import Database
from tools.hierarchic_logger import HierarchicLogger
import logging


def on_sigint(_signal, _frame):
    if myStream.running:
        myStream.disconnect()

        if not myStream.running:
            logger.debug('Stream connection is closed')

    db.close()
    sys.exit(0)


pp = pprint.PrettyPrinter(indent=4)
logging.setLoggerClass(HierarchicLogger)
logger = get_module_logger()
db = Database('./store/data.db')


# override tweepy.StreamListener to add logic to on_status
class MyStreamListener(tweepy.StreamListener):

    def __init__(self):
        tweepy.StreamListener.__init__(self)
        self.storing = Storing(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'store'))
        self.slack_bot = SlackApp()

    def on_status(self, status):
        # storing.save(status)
        # print(status.text)
        # pp.pprint(vars(status))
        logger.raise_hier_level('debug')
        logger.debug('START - MyStreamListerner.on_status')
        tweet_status = ensure_original_from_retweet(status._json)
        self.storing.log_status_detail(tweet_status)
        save_paths = self.storing.save_if_has_media(tweet_status)
        if len(save_paths) != 0:
            ts_title_tuples = self.slack_bot.upload_image(save_paths, tweet_status)
            for file_id, ts, title in ts_title_tuples:
                db.add_entry(file_id, ts, title, tweet_status['user']['screen_name'])

        logger.debug('END - MyStreamListerner.on_status')
        logger.drop_hier_level('debug')
        '''
        if 'extended_entities' in status._json:
            # pp.pprint(status._json['extended_entities']['media'])
            # pp.pprint(status._json)
            # self.storing.save(status)
            # exit()
        else:
            print("no media")
            '''
            

consumer_key = os.getenv('NIJIETTER_TWITTER_CONSUMER_KEY', None)
consumer_secret = os.getenv('NIJIETTER_TWITTER_CONSUMER_SECRET', None)
access_token = os.getenv('NIJIETTER_TWITTER_ACCESS_TOKEN', None)
access_token_secret = os.getenv('NIJIETTER_TWITTER_ACCESS_TOKEN_SECRET', None)

# storing = Storing()

auth = tweepy.OAuthHandler(consumer_key, consumer_secret)
auth.set_access_token(access_token, access_token_secret)

api = tweepy.API(auth)

# public_tweets = api.home_timeline()
# for tweet in public_tweets:
#     print(tweet.text)

myStream = tweepy.Stream(auth=api.auth, listener=MyStreamListener())

signal.signal(signal.SIGINT, on_sigint)

logger.debug('Build stream connection')

# myStream.filter(track=['python'])
myStream.userstream()

