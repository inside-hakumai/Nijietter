from learner.model import Model
import sys
import numpy as np
from sklearn.externals import joblib
import re
import MeCab

args = sys.argv

model_path = args[1]
values_path = args[2]
user_name = args[3]
tweet_text = args[4]

mecab = MeCab.Tagger('-d /usr/local/lib/mecab/dic/mecab-ipadic-neologd')

model = Model()
model.estimator = joblib.load(model_path)

npz_file = np.load(values_path)
model.word_dictionary = npz_file['arr_0']
model.word_index2word = npz_file['arr_1']
model.word_score = npz_file['arr_2']
model.user_dictionary = npz_file['arr_3']
model.user_index2user = npz_file['arr_4']
model.user_score = npz_file['arr_5']


tweet = re.sub(r'http(s)?://([\w-]+\.)+[\w-]+(/[-\w ./?%&=]*)?', '', tweet_text)
words = []
mecab.parse('')  # 文字列がGCされるのを防ぐ
node = mecab.parseToNode(tweet)
while node:
    if node.feature.split(",")[0] == '名詞' or node.feature.split(",")[0] == '動詞':
        word = node.surface
        # print('{}'.format(word))
        words.append(word)
    node = node.next

result = model.predict([[model.get_score_from_username(user_name), model.get_words_score_avg(words)]])
print(result)




