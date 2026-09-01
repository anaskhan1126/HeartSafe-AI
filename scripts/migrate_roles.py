"""Add default role=patient to existing users missing the role field."""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from pymongo import MongoClient


def main():
    mongo_uri = os.environ.get('MONGO_URI', 'mongodb://localhost:27017/heart_prediction')
    db_name = mongo_uri.rsplit('/', 1)[-1].split('?')[0] or 'heart_prediction'
    db = MongoClient(mongo_uri)[db_name]

    result = db.users.update_many(
        {'role': {'$exists': False}},
        {'$set': {'role': 'patient', 'language': 'en'}},
    )
    print(f'Updated {result.modified_count} user(s) with default role.')


if __name__ == '__main__':
    main()
