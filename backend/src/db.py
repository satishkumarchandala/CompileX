import os
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

_client = None
_db = None


def init_db():
    global _client, _db
    if _client is None:
        uri = os.getenv('MONGODB_URI', 'mongodb://localhost:27017')
        _client = MongoClient(uri)
        _db = _client.get_database(os.getenv('MONGODB_DB', 'compiler_gamified'))
    return _db


def get_db():
    if _db is None:
        return init_db()
    return _db
