import logging
from nijietter.model import Storing
import os.path


def get_module_logger(modname='default_logger'):
    log_path = './log/'
    if not os.path.exists(log_path):
        os.makedirs(log_path)

    logger = logging.getLogger(modname)

    if not logger.hasHandlers():
        handler = logging.StreamHandler()
        # handler = logging.FileHandler(os.path.join(log_path, 'log.txt'))
        # formatter = logging.Formatter('my-format')
        formatter = logging.Formatter('[%(asctime)s - %(levelname)s] %(message)s')
        # formatter = logging.Formatter('%(message)s')
        handler.setFormatter(formatter)
        logger.addHandler(handler)
        logger.setLevel(logging.DEBUG)

    return logger
