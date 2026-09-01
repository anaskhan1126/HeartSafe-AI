"""Create an admin user from the command line.

Usage:
    python scripts/create_admin.py --name "Admin User" --email admin@heartai.com --password secret123
"""
import argparse
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from pymongo import MongoClient
from werkzeug.security import generate_password_hash
from datetime import datetime


def main():
    parser = argparse.ArgumentParser(description='Create an admin user')
    parser.add_argument('--name', required=True)
    parser.add_argument('--email', required=True)
    parser.add_argument('--password', required=True)
    args = parser.parse_args()

    mongo_uri = os.environ.get('MONGO_URI', 'mongodb://localhost:27017/heart_prediction')
    db_name = mongo_uri.rsplit('/', 1)[-1].split('?')[0] or 'heart_prediction'
    db = MongoClient(mongo_uri)[db_name]

    email = args.email.lower().strip()
    if db.users.find_one({'email': email}):
        print(f'User with email {email} already exists.')
        existing = db.users.find_one({'email': email})
        db.users.update_one({'_id': existing['_id']}, {'$set': {'role': 'admin'}})
        print('Updated existing user to admin role.')
        return

    user = {
        'name': args.name,
        'email': email,
        'password': generate_password_hash(args.password),
        'role': 'admin',
        'createdAt': datetime.utcnow(),
        'theme': 'light',
        'language': 'en',
    }
    result = db.users.insert_one(user)
    print(f'Admin created successfully. ID: {result.inserted_id}')


if __name__ == '__main__':
    main()
