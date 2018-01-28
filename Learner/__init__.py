import Learner.DataCollector
from Learner.Resource.Resource import Resource
import Learner.DataProcessor
from Learner.Model import Model

import os
os.makedirs(os.path.dirname(os.path.abspath(__file__)) + "/data/", exist_ok=True)
