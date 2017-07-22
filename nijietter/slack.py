import requests
import json
import os


class SlackApp:

    def __init__(self):
        self.webhook_url = 'https://hooks.slack.com/services/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'
        self.file_upload_url = 'https://slack.com/api/files.upload'
        self.oauth_access_token = 'xoxp-28547270640-28547270688-216088975876-1cf3f1bd35da1332b783dd0bf5f6c69b'
        self.chanel_id = 'C6CTA6ME3'

    def send_message(self, text):
        payload = json.dumps({
            "user": "Nijietter",
            "text": text
        })
        requests.post(self.webhook_url, payload)

    def upload_file(self, file_path, up_filename=None):
        file = {'file': (file_path, open(file_path, 'rb'), 'jpg')}
        payload = {
            "token": self.oauth_access_token,
            "channels": self.chanel_id,
            "filename": up_filename if up_filename else os.path.basename(file_path)
        }
        res = requests.post(self.file_upload_url, files=file, data=payload)
        print(res.text)


if __name__ == '__main__':
    # sample_text = "This is a line of text in a channel.\nAnd this is another line of text."
    slack_app = SlackApp()
    slack_app.upload_file('./store/886608453061312512.jpg')
    # slack_app.send_message(sample_text)
