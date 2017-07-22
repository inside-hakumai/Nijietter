import logging


class HierarchicLogger(logging.Logger):

    def __init__(self, name, level=logging.NOTSET):
        super().__init__(name, level)
        self.hier_level = 0

    def raise_hier_level(self):
        self.debug('┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'[:(-2*(self.hier_level+1))])
        self.hier_level = self.hier_level + 1

    def drop_hier_level(self):
        if self.hier_level == 0:
            raise InvalidHierLevelException()
        else:
            self.hier_level = self.hier_level - 1
            if self.hier_level == 0:
                self.debug('┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', )
            else:
                self.debug('┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'[:(-2*(self.hier_level+1))])

    def debug(self, msg, **kwargs):
        message = "┃ " * self.hier_level + msg
        super().debug(message, **kwargs)


class InvalidHierLevelException(Exception):
    pass
