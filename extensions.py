from flask_jwt_extended import JWTManager
from pymongo import MongoClient, ASCENDING, DESCENDING

jwt = JWTManager()
mongo_client = None
db = None


def init_db(app):
    global mongo_client, db
    mongo_uri = app.config['MONGO_URI']
    mongo_client = MongoClient(mongo_uri)
    db_name = mongo_uri.rsplit('/', 1)[-1].split('?')[0] or 'heart_prediction'
    db = mongo_client[db_name]
    _ensure_indexes()
    return db


def _ensure_indexes():
    db.users.create_index('email', unique=True)
    db.users.create_index('role')
    db.users.create_index('assignedDoctorId')
    db.records.create_index([('userId', ASCENDING), ('timestamp', DESCENDING)])
    db.records.create_index('prediction')
    db.records.create_index('timestamp')
    db.records.create_index([('timestamp', DESCENDING)])
    # Enterprise collections
    db.consultations.create_index([('patientId', ASCENDING), ('createdAt', DESCENDING)])
    db.consultations.create_index([('doctorId', ASCENDING), ('status', ASCENDING)])
    db.appointments.create_index([('userId', ASCENDING), ('appointmentDate', ASCENDING)])
    db.medications.create_index([('userId', ASCENDING), ('active', ASCENDING)])
    db.family_history.create_index('userId', unique=True)
    db.audit_logs.create_index([('timestamp', DESCENDING)])
    db.audit_logs.create_index('action')
    db.audit_logs.create_index('userId')
    db.notifications.create_index([('userId', ASCENDING), ('read', ASCENDING), ('createdAt', DESCENDING)])
