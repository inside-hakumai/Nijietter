from sklearn.svm import SVC


class Model:

    def __init__(self):
        self.model = SVC(kernel="rbf", random_state=None)


