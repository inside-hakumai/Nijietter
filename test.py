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
from tools.hierarchic_logger import HierarchicLogger
import logging


def on_sigint(_signal, _frame):
    if myStream.running:
        myStream.disconnect()

        if not myStream.running:
            logger.debug('Stream connection is closed')

    sys.exit(0)


pp = pprint.PrettyPrinter(indent=4)
logging.setLoggerClass(HierarchicLogger)
logger = get_module_logger()


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
        logger.raise_hier_level()
        logger.debug('START - MyStreamListerner.on_status')
        tweet_status = ensure_original_from_retweet(status._json)
        self.storing.log_status_detail(tweet_status)
        save_paths = self.storing.save_if_has_media(tweet_status)
        if len(save_paths) != 0:
            self.slack_bot.send_image(save_paths, tweet_status['text'])

        logger.drop_hier_level()
        logger.debug('END - MyStreamListerner.on_status')
        '''
        if 'extended_entities' in status._json:
            # pp.pprint(status._json['extended_entities']['media'])
            # pp.pprint(status._json)
            # self.storing.save(status)
            # exit()
        else:
            print("no media")
            '''
            

consumer_key = "A53HhpKOptdAwfdKBGU4zdmkH"
consumer_secret = "Fcx9oHf3nbjwfuxKUKlLytJchn42YTRZK12FVSbslIfRwyladZ"

access_token = "1481911626-WpsUFfWqidCDt5PIXLjZImJiPUVOVbmvRHOipCS"
access_token_secret = "SAV6I6U5yPqJwsiHfx2UEpe3sFx3xxsImCA7WfunuxYij"

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

