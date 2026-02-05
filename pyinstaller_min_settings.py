# Minimal Django settings used only during PyInstaller analysis
# Keeps INSTALLED_APPS empty so the PyInstaller Django hook doesn't try
# to import project apps which may require full settings or DB access.

SECRET_KEY = 'pyinstaller-temporary-key'
DEBUG = False
ALLOWED_HOSTS = ['127.0.0.1', 'localhost']

# Avoid importing any project apps during analysis
INSTALLED_APPS = []

ROOT_URLCONF = 'projet_velib.urls'

# Minimal middleware list
MIDDLEWARE = []

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': ':memory:',
    }
}

# Static files placeholder
STATIC_URL = '/static/'
