from datetime import datetime
from bson import ObjectId
from werkzeug.security import generate_password_hash
import extensions


class User:
    @staticmethod
    def _col():
        return extensions.db.users

    @staticmethod
    def create(name, email, password, role='patient', assigned_doctor_id=None):
        user = {
            'name': name,
            'email': email.lower().strip(),
            'password': generate_password_hash(password),
            'role': role,
            'createdAt': datetime.utcnow(),
            'theme': 'light',
            'language': 'en',
        }
        if assigned_doctor_id:
            user['assignedDoctorId'] = ObjectId(assigned_doctor_id)
        result = User._col().insert_one(user)
        user['_id'] = result.inserted_id
        return user

    @staticmethod
    def find_by_email(email):
        return User._col().find_one({'email': email.lower().strip()})

    @staticmethod
    def find_by_id(user_id):
        if not user_id or not ObjectId.is_valid(str(user_id)):
            return None
        return User._col().find_one({'_id': ObjectId(user_id)})

    @staticmethod
    def find_all(filters=None, page=1, per_page=10, sort_by='createdAt', sort_order='desc'):
        query = filters or {}
        sort_dir = -1 if sort_order == 'desc' else 1
        allowed_sort = {'createdAt', 'name', 'email', 'role'}
        sort_field = sort_by if sort_by in allowed_sort else 'createdAt'
        skip = (page - 1) * per_page
        cursor = User._col().find(query).sort(sort_field, sort_dir).skip(skip).limit(per_page)
        total = User._col().count_documents(query)
        return list(cursor), total

    @staticmethod
    def find_patients_by_doctor(doctor_id, page=1, per_page=10):
        if not doctor_id or not ObjectId.is_valid(str(doctor_id)):
            return [], 0
        query = {'role': 'patient', 'assignedDoctorId': ObjectId(doctor_id)}
        skip = (page - 1) * per_page
        cursor = User._col().find(query).sort('name', 1).skip(skip).limit(per_page)
        total = User._col().count_documents(query)
        return list(cursor), total

    @staticmethod
    def find_doctors(page=1, per_page=10):
        return User.find_all({'role': 'doctor'}, page, per_page)

    @staticmethod
    def update(user_id, data):
        update_data = {}
        if 'name' in data:
            update_data['name'] = data['name']
        if 'email' in data:
            update_data['email'] = data['email'].lower().strip()
        if 'password' in data:
            update_data['password'] = generate_password_hash(data['password'])
        if 'theme' in data:
            update_data['theme'] = data['theme']
        if 'language' in data:
            update_data['language'] = data['language']
        if 'role' in data:
            update_data['role'] = data['role']
        unset_data = {}
        if 'assignedDoctorId' in data:
            val = data['assignedDoctorId']
            if val:
                update_data['assignedDoctorId'] = ObjectId(val)
            else:
                unset_data['assignedDoctorId'] = ''

        if not update_data and not unset_data:
            return User.find_by_id(user_id)

        update_op = {}
        if update_data:
            update_op['$set'] = update_data
        if unset_data:
            update_op['$unset'] = unset_data

        User._col().update_one({'_id': ObjectId(user_id)}, update_op)
        return User.find_by_id(user_id)

    @staticmethod
    def delete(user_id):
        result = User._col().delete_one({'_id': ObjectId(user_id)})
        return result.deleted_count > 0

    @staticmethod
    def count_by_role(role):
        return User._col().count_documents({'role': role})

    @staticmethod
    def to_public(user):
        if not user:
            return None
        data = {
            'id': str(user['_id']),
            'name': user['name'],
            'email': user['email'],
            'role': user.get('role', 'patient'),
            'createdAt': user['createdAt'].isoformat(),
            'theme': user.get('theme', 'light'),
            'language': user.get('language', 'en'),
        }
        if user.get('assignedDoctorId'):
            data['assignedDoctorId'] = str(user['assignedDoctorId'])
        return data


class PredictionRecord:
    @staticmethod
    def _col():
        return extensions.db.records

    @staticmethod
    def create(user_id, inputs, prediction, probability):
        record = {
            'userId': ObjectId(user_id),
            'inputs': inputs,
            'prediction': prediction,
            'probability': probability,
            'timestamp': datetime.utcnow(),
        }
        result = PredictionRecord._col().insert_one(record)
        record['_id'] = result.inserted_id
        return record

    @staticmethod
    def find_by_user(user_id, page=1, per_page=10, filters=None, sort_by='timestamp', sort_order='desc'):
        if not user_id or not ObjectId.is_valid(str(user_id)):
            return [], 0
        query = {'userId': ObjectId(user_id)}
        if filters:
            query.update(filters)
        return PredictionRecord._paginate(query, page, per_page, sort_by, sort_order)

    @staticmethod
    def find_by_users(user_ids, page=1, per_page=10, filters=None, sort_by='timestamp', sort_order='desc'):
        valid_ids = [ObjectId(uid) for uid in user_ids if uid and ObjectId.is_valid(str(uid))]
        if not valid_ids:
            return [], 0
        query = {'userId': {'$in': valid_ids}}
        if filters:
            query.update(filters)
        return PredictionRecord._paginate(query, page, per_page, sort_by, sort_order)

    @staticmethod
    def find_all(page=1, per_page=10, filters=None, sort_by='timestamp', sort_order='desc'):
        query = filters or {}
        return PredictionRecord._paginate(query, page, per_page, sort_by, sort_order)

    @staticmethod
    def _paginate(query, page, per_page, sort_by, sort_order):
        sort_dir = -1 if sort_order == 'desc' else 1
        allowed_sort = {'timestamp', 'prediction', 'probability'}
        sort_field = sort_by if sort_by in allowed_sort else 'timestamp'
        skip = (page - 1) * per_page
        cursor = PredictionRecord._col().find(query).sort(sort_field, sort_dir).skip(skip).limit(per_page)
        total = PredictionRecord._col().count_documents(query)
        return list(cursor), total

    @staticmethod
    def find_by_id(record_id):
        if not record_id or not ObjectId.is_valid(str(record_id)):
            return None
        return PredictionRecord._col().find_one({'_id': ObjectId(record_id)})

    @staticmethod
    def count_by_user(user_id):
        if not user_id or not ObjectId.is_valid(str(user_id)):
            return 0
        return PredictionRecord._col().count_documents({'userId': ObjectId(user_id)})

    @staticmethod
    def delete(record_id, user_id=None):
        if not record_id or not ObjectId.is_valid(str(record_id)):
            return False
        query = {'_id': ObjectId(record_id)}
        if user_id:
            if not ObjectId.is_valid(str(user_id)):
                return False
            query['userId'] = ObjectId(user_id)
        result = PredictionRecord._col().delete_one(query)
        return result.deleted_count > 0

    @staticmethod
    def to_public(record, include_user=False, user=None):
        data = {
            'id': str(record['_id']),
            'inputs': record['inputs'],
            'prediction': record['prediction'],
            'probability': record['probability'],
            'timestamp': record['timestamp'].isoformat(),
            'userId': str(record['userId']),
        }
        if include_user and user:
            data['patientName'] = user.get('name')
        return data

    @staticmethod
    def build_date_filter(start_date=None, end_date=None):
        date_filter = {}
        if start_date and isinstance(start_date, str) and start_date.strip():
            try:
                date_filter['$gte'] = datetime.fromisoformat(start_date.strip().replace('Z', ''))
            except (ValueError, TypeError):
                pass
        if end_date and isinstance(end_date, str) and end_date.strip():
            try:
                end = datetime.fromisoformat(end_date.strip().replace('Z', ''))
                end = end.replace(hour=23, minute=59, second=59)
                date_filter['$lte'] = end
            except (ValueError, TypeError):
                pass
        if date_filter:
            return {'timestamp': date_filter}
        return {}
