# -*- coding:utf-8 -*-

import os
from flask import Flask, render_template, request as freq, redirect, url_for
import numpy as np
from Learner.Resource import Resource
from Learner.DataCollector.TweetDB import TweetDB, LabelDB
from Learner.DataProcessor.Entry import Entry
import json
import requests

FILE_DIR = os.path.dirname(os.path.abspath(__file__))
resource = Resource(FILE_DIR + "/../../config.json")
entry_db = Entry(resource.get_collect_db_path())



# 自身の名称を app という名前でインスタンス化する
app = Flask(__name__)


# メッセージをランダムに表示するメソッド
def picked_up():
    messages = [
        "こんにちは、あなたの名前を入力してください",
        "やあ！お名前は何ですか？",
        "あなたの名前を教えてね"
    ]
    # NumPy の random.choice で配列からランダムに取り出し
    return np.random.choice(messages)


# ここからウェブアプリケーション用のルーティングを記述
# index にアクセスしたときの処理
@app.route('/')
def index():
    title = "ようこそ"
    message = picked_up()
    # index.html をレンダリングする
    return render_template("index.html",
                           message=message, title=title)


@app.route('/request', methods=['GET'])
def request():
    db_data = entry_db.get_unlabeled_tweet(10, 0)

    ret_data = []

    for tweet_data in db_data:
        tweet_json = json.loads(tweet_data[1])
        user_name  = tweet_json["user"]["screen_name"]
        post_id    = tweet_data[0]
        url        = "https://twitter.com/{0}/status/{1}".format(user_name, post_id)

        payload = {"url": url}
        res = requests.get('https://publish.twitter.com/oembed', params=payload)
        print(res.text)

        res = res.json()

        ret_data.append({
            "id"  : post_id,
            "html": res["html"]
        })

    # ret_data = list(map(lambda li: {"id": li[0], "json": li[1]}, db_data))
    ret_data_dump = json.dumps(ret_data)
    # print(ret_data)
    return ret_data_dump


@app.route('/register', methods=['GET'])
def register():
    if entry_db.insert_label(freq.args.get("post-id"), int(freq.args.get("label"))):
        return "ok"
    else:
        raise Exception("register fail")


if __name__ == '__main__':
    app.debug = True  # デバッグモード有効化
    app.run(host='localhost')  # どこからでもアクセス可能に
