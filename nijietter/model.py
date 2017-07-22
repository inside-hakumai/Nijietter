from datetime import datetime, tzinfo, timedelta
import urllib
import os.path


class JST(tzinfo):
    def utcoffset(self, dt):
        return timedelta(hours=9)

    def dst(self, dt):
        return timedelta(0)

    def tzname(self, dt):
        return 'JST'


class Storing:

    def __init__(self, store_dir):
        from nijietter import get_module_logger
        self.store_root = store_dir
        self.store_images = os.path.join(self.store_root, 'images/')
        self.store_sym_user = os.path.join(self.store_root, 'sym_user/')
        self.store_sym_date = os.path.join(self.store_root, 'sym_date/')
        self.logger = get_module_logger(__name__)

        if ensure_dir(self.store_images):
            self.logger.debug('create directory ' + self.store_images)
        if ensure_dir(self.store_sym_user):
            self.logger.debug('create directory ' + self.store_sym_user)
        if ensure_dir(self.store_sym_date):
            self.logger.debug('create directory ' + self.store_sym_date)
        
    def save(self, status):
        statuses_media = status['extended_entities']['media']
        paths = []

        for status_media in statuses_media:
            if not self.image_already_saved(status_media):
                path = self.save_image(status_media)
                self.link_sym_user(path, status)
                paths.append(path)

        return paths

    def save_if_has_media(self, status):
        if 'extended_entities' in status:
            return self.save(status)
        else:
            return []

    def image_already_saved(self, status_media):
        media_id = status_media['id_str']
        store_filename = media_id + '.jpg'
        store_subdir = media_id[:5]
        assumed_file_path = os.path.join(self.store_images, store_subdir, store_filename)

        if os.path.exists(assumed_file_path):
            self.logger('The image is already saved')
            return True
        else:
            return False

    def save_image(self, status_media, create_sym_user = False):
        media_id = status_media['id_str']
        image_url = status_media['media_url']
        store_filename = media_id + '.jpg'
        store_subdir = media_id[:5]
        store_path = os.path.join(self.store_images, store_subdir, store_filename)
        ensure_dir(store_path)
        with urllib.request.urlopen(image_url) as url:
            with open(store_path, 'wb') as f:
                f.write(url.read())
        self.logger.debug('Save : ' + store_path)

        return store_path

    def link_sym_user(self, src_path, status):
        user_screen_name = status['user']['screen_name']
        created_time = datetime.strptime(status['created_at'], '%a %b %d %H:%M:%S %z %Y')\
            .strftime('%y%m%d')
        filename = os.path.basename(src_path)
        sym_path = os.path.join(self.store_sym_user, user_screen_name, created_time, filename)
        self.logger.debug('Link: {}'.format(sym_path))
        ensure_dir(sym_path)
        os.symlink(src_path, sym_path)

    def log_status_detail(self, status):
        tweet_id = status['id_str']
        # self.logger.debug('[' + status_data['created_at'] + ']')
        created_time = datetime.strptime(status['created_at'], '%a %b %d %H:%M:%S %z %Y')
        text_head = status['text'][:20].replace('\n', '')
        if 'extended_entities' in status:
            image_id = ', '.join(map(lambda m: m['id_str'], status['extended_entities']['media']))
        else:
            image_id = 'no images'
        self.logger.debug('[{}] {}\nText : {}...\nImage: {}'.format(created_time.astimezone(tz=JST()), tweet_id, text_head, image_id))


def ensure_original_from_retweet(status):
    if 'retweeted_status' in status:
        return status['retweeted_status']
    else:
        return status

def ensure_dir(path):
    directory = os.path.dirname(path)
    if not os.path.exists(directory):
        os.makedirs(directory)
        return True
    return False

