import requests
import json

webhook_url = 'https://hooks.slack.com/services/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'

payload = json.dumps({
    "user": "Nijietter"
    "text": "This is a line of text in a channel.\nAnd this is another line of text."
})

requests.post(webhook_url, payload)
