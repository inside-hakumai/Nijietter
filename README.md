# にじえったー(Nijietter)
**にじえったー** は、Twitterのタイムラインから **二次元イラスト「っぽいもの」** を抽出するツールです。

## WebApp
以下のURLよりWebアプリケーションとして利用できます。  
[http://nijietter.insidehakumai.net](http://nijietter.insidehakumai.net)

## SlackTool
タイムラインを監視し、イラストをSlackに投稿するツールとして利用できます。

### 動作環境
以下の環境で動作を確認しています。  

- Node.js v6.11.1
- npm v3.11.10
- MeCab v0.996

その他依存パッケージはPackage.jsonを参照してください。  
また、MeCabのシステム辞書として[mecab-ipadic-NEologd](https://github.com/neologd/mecab-ipadic-neologd)が必要です。

### Getting Started

#### アプリケーション登録

Twitterのアプリケーション登録、SlackのBot登録が必要です。  
以下のページからそれぞれ登録を行ってください。

- Twitter - [https://apps.twitter.com/](https://apps.twitter.com/)
- Slack - [https://my.slack.com/services/new/bot](https://my.slack.com/services/new/bot)

#### 環境変数
各種アクセストークンやmecab-ipadic-neologdのディレクトリパスを利用するため、プロジェクトルートに`.env`というファイルを作成し、以下の形式で記述してください。

```
SLACK_OAUTH_ACCESS_TOKEN="(Slackのアクセストークン)"
SLACK_CHANNEL_ID="(Slackの画像投稿先チャンネルID)"
TWITTER_CONSUMER_KEY="(TwitterのConsumer Key)"
TWITTER_CONSUMER_SECRET="(TwitterのConsumer Secret)"
TWITTER_ACCESS_TOKEN="(Twitterのアクセストークン)"
TWITTER_ACCESS_TOKEN_SECRET="(Twitterのアクセストークンシークレット)"
MECAB_NEOLOGD_LOCATION="(mecab-ipadic-neologdのディレクトリパス)"
```

なお、mecab-ipadic-neologdのディレクトリパスは以下のコマンドで確認できます。

```
echo `mecab-config --dicdir`"/mecab-ipadic-neologd"
```

#### 実行
以下でTwitterのタイムラインの監視を開始します。

```
node slack_main.js
```
