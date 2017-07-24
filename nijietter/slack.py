from datetime import datetime

import requests
import json
import os
from nijietter import get_module_logger


class SlackApp:

    def __init__(self):
        self.webhook_url = 'https://hooks.slack.com/services/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'
        self.file_upload_url = 'https://slack.com/api/files.upload'
        self.oauth_access_token = os.getenv('NIJIETTER_SLACK_OAUTH_ACCESS_TOKEN', None)
        self.chanel_id = 'C6C6BQCKD'
        self.logger = get_module_logger()

    def send_message(self, text):
        payload = json.dumps({
            "user": "Nijietter",
            "text": text
        })
        requests.post(self.webhook_url, payload)

    def upload_file(self, file_path, up_filename=None, comment=None):
        self.logger.raise_hier_level('debug')
        self.logger.debug('START - SlackApp.upload_file')
        self.logger.debug('File path: {}'.format(file_path), )
        file = {'file': (file_path, open(file_path, 'rb'), 'jpg')}
        payload = {
            "token": self.oauth_access_token,
            "channels": self.chanel_id,
            "filename": up_filename if up_filename else os.path.basename(file_path),
            "initial_comment": comment if comment else ""
        }
        res = requests.post(self.file_upload_url, files=file, data=payload)
        # print(res.text)
        self.logger.debug('END - SlackApp.upload_file')
        self.logger.drop_hier_level('debug')

    def set_active(self):
        set_active_url = "https://slack.com/api/users.setActive"
        res = requests.post(set_active_url, data={"token": self.oauth_access_token})
        # print(res.text)

    def auth_test(self):
        auth_test_url = "https://slack.com/api/auth.test"
        res = requests.post(auth_test_url, data={"token": self.oauth_access_token})
        # print(res.text)

    def upload_image(self, save_paths, tweet_status):
        tweet_text = tweet_status['text']
        user_name = tweet_status['user']['name']
        user_scr_name = tweet_status['user']['screen_name']
        post_time = datetime.strptime(tweet_status['created_at'], '%a %b %d %H:%M:%S %z %Y')\
            .strftime('%Y-%m-%d %H:%M:%S')

        comment = 'Post by {}(@{}) at {}\n-------------------------------------------\n{}'\
            .format(user_name, user_scr_name, post_time, tweet_text)

        for save_path in save_paths:
            self.upload_file(save_path, comment=comment)


if __name__ == '__main__':
    # sample_text = "This is a line of text in a channel.\nAnd this is another line of text."
    slack_app = SlackApp()
    # slack_app.upload_file('./store/886608453061312512.jpg')
    slack_app.set_active()
    # slack_app.send_message(sample_text)
