import logging


level_name = [
    'CRITICAL', 'critical',
    'ERROR', 'error',
    'WARN', 'warn',
    'WARNING', 'warning',
    'INFO', 'info',
    'DEBUG', 'debug',
    'LOG', 'log',
]


class HierarchicLogger(logging.Logger):

    def __init__(self, name, level=logging.NOTSET, bc_char='┏', ec_char='┗', h_char='━', v_char='┃', length=60):
        super().__init__(name, level)
        self.hier_level = 0
        self.border_begin_corner = bc_char
        self.border_end_corner = ec_char
        self.border_h_line = h_char
        self.border_v_line = v_char
        self.border_length = length

    def raise_hier_level(self, level=None):
        if level is not None:
            if level in level_name:
                lvl = level.lower()
                getattr(self, lvl)(self.get_start_border(self.hier_level))
            else:
                raise InvalidLogLevelException
        self.hier_level = self.hier_level + 1

    def drop_hier_level(self, level=None):
        if self.hier_level == 0:
            raise InvalidHierLevelException()
        else:
            self.hier_level = self.hier_level - 1
            if level is not None:
                if level in level_name:
                    lvl = level.lower()
                    getattr(self, lvl)(self.get_end_border(self.hier_level, self.hier_level == 0))
                else:
                    raise InvalidLogLevelException

    def get_start_border(self, level, break_after=False):
        text = self.border_begin_corner + self.border_h_line * (self.border_length - level*2)
        if break_after:
            return text + '\n'
        else:
            return text

    def get_end_border(self, level, break_after=False):
        text = self.border_end_corner + self.border_h_line * (self.border_length - level*2)
        if break_after:
            return text + '\n'
        else:
            return text

    def critical(self, msg, **kwargs):
        message = "┃ " * self.hier_level + msg
        super().critical(message, **kwargs)

    def error(self, msg, **kwargs):
        message = "┃ " * self.hier_level + msg
        super().error(message, **kwargs)

    def warning(self, msg, **kwargs):
        message = "┃ " * self.hier_level + msg
        super().warning(message, **kwargs)

    def warn(self, msg, **kwargs):
        message = "┃ " * self.hier_level + msg
        super().warn(message, **kwargs)

    def info(self, msg, **kwargs):
        message = "┃ " * self.hier_level + msg
        super().info(message, **kwargs)

    def debug(self, msg, **kwargs):
        message = "┃ " * self.hier_level + msg
        super().debug(message, **kwargs)

    def log(self, msg, **kwargs):
        message = "┃ " * self.hier_level + msg
        super().log(message, **kwargs)


class InvalidHierLevelException(Exception):
    pass


class InvalidLogLevelException(Exception):
    pass
