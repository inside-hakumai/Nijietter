import signal
from datetime import datetime
import os
import sys
import tweepy
import pprint
from nijietter import Storing
from nijietter import get_module_logger
from nijietter.model import ensure_original_from_retweet


def on_sigint(_signal, _frame):
    if myStream.running:
        myStream.disconnect()

        if not myStream.running:
            logger.debug('[{}] Stream connection is closed'.format(datetime.now()))

    sys.exit(0)


pp = pprint.PrettyPrinter(indent=4)
logger = get_module_logger(__name__)

# override tweepy.StreamListener to add logic to on_status
class MyStreamListener(tweepy.StreamListener):

    def __init__(self):
        tweepy.StreamListener.__init__(self)
        self.storing = Storing(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'store'))

    def on_status(self, status):
        # storing.save(status)
        # print(status.text)
        # pp.pprint(vars(status))
        tweet_status = ensure_original_from_retweet(status._json)
        self.storing.log_status_detail(tweet_status)
        self.storing.save_if_has_media(tweet_status)
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

myStream = tweepy.Stream(auth = api.auth, listener=MyStreamListener())

signal.signal(signal.SIGINT, on_sigint)

now = datetime.now()
logger.debug('[{}] Build stream connection'.format(now))

# myStream.filter(track=['python'])
myStream.userstream()

