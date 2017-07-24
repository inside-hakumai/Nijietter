import logging


level_name = [
    'CRITICAL', 'critical',
    'ERROR', 'error',
    'WARN', 'warn',
    'WARNING', 'warning',
    'INFO', 'info',
    'DEBUG', 'debug',
]


class HierarchicLogger(logging.Logger):

    def __init__(self, name, level=logging.NOTSET, bc_char='+', ec_char='+', h_char='-', v_char='| ', length=60):
        super().__init__(name, level)
        self.hier_level = 0
        self.border_begin_corner = bc_char
        self.border_end_corner = ec_char
        self.border_h_char = h_char
        self.border_v_char = v_char
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
        text = self.border_begin_corner + self.border_h_char * (self.border_length - (level+1))
        if break_after:
            return text + '\n'
        else:
            return text

    def get_end_border(self, level, break_after=False):
        text = self.border_end_corner + self.border_h_char * (self.border_length - (level+1))
        if break_after:
            return text + '\n'
        else:
            return text

    def critical(self, msg, *args, **kwargs):
        msg_lines = msg.split('\n')
        for line in msg_lines:
            message = self.join_border_to_msg(self.hier_level, line)
            super().critical(message, *args, **kwargs)

    def error(self, msg, *args, **kwargs):
        msg_lines = msg.split('\n')
        for line in msg_lines:
            message = self.join_border_to_msg(self.hier_level, line)
            super().error(message, *args, **kwargs)

    def warning(self, msg, *args, **kwargs):
        msg_lines = msg.split('\n')
        for line in msg_lines:
            message = self.join_border_to_msg(self.hier_level, line)
            super().warning(message, *args, **kwargs)

    def warn(self, msg, *args, **kwargs):
        msg_lines = msg.split('\n')
        for line in msg_lines:
            message = self.join_border_to_msg(self.hier_level, line)
            super().warn(message, *args, **kwargs)

    def info(self, msg, *args, **kwargs):
        msg_lines = msg.split('\n')
        for line in msg_lines:
            message = self.join_border_to_msg(self.hier_level, line)
            super().info(message, *args, **kwargs)

    def debug(self, msg, *args, **kwargs):
        msg_lines = msg.split('\n')
        for line in msg_lines:
            message = self.join_border_to_msg(self.hier_level, line)
            super().debug(message, *args, **kwargs)

    '''
    def log(self, msg, **kwargs):
        message = self.join_border_to_msg(self.hier_level, msg)
        super().log(message, **kwargs)
    '''

    def join_border_to_msg(self, brd_num, msg):
        if brd_num == 0:
            return msg
        elif brd_num == 1:
            return self.border_v_char + msg
        elif brd_num > 1:
            return self.join_border_to_msg(brd_num-1, self.border_v_char + msg)
        else:
            raise InvalidNumberException


class InvalidNumberException(Exception):
    pass


class InvalidHierLevelException(Exception):
    pass


class InvalidLogLevelException(Exception):
    pass
