from datetime import datetime
from bson import ObjectId
import extensions


def _oid(val):
    return ObjectId(val) if val and not isinstance(val, ObjectId) else val


class Consultation:
    @staticmethod
    def _col():
        return extensions.db.consultations

    @staticmethod
    def create(patient_id, doctor_id, subject, message):
        doc = {
            'patientId': _oid(patient_id),
            'doctorId': _oid(doctor_id) if doctor_id else None,
            'subject': subject,
            'message': message,
            'status': 'pending',
            'response': None,
            'createdAt': datetime.utcnow(),
            'updatedAt': datetime.utcnow(),
        }
        result = Consultation._col().insert_one(doc)
        doc['_id'] = result.inserted_id
        return doc

    @staticmethod
    def find_by_id(cid):
        return Consultation._col().find_one({'_id': _oid(cid)})

    @staticmethod
    def find_for_patient(patient_id, page=1, per_page=20):
        query = {'patientId': _oid(patient_id)}
        return Consultation._paginate(query, page, per_page)

    @staticmethod
    def find_for_doctor(doctor_id, page=1, per_page=20, status=None):
        query = {'$or': [
            {'doctorId': _oid(doctor_id)},
            {'doctorId': None, 'status': 'pending'},
        ]}
        if status:
            query = {'doctorId': _oid(doctor_id), 'status': status}
        return Consultation._paginate(query, page, per_page)

    @staticmethod
    def find_all(page=1, per_page=20):
        return Consultation._paginate({}, page, per_page)

    @staticmethod
    def _paginate(query, page, per_page):
        skip = (page - 1) * per_page
        cursor = Consultation._col().find(query).sort('createdAt', -1).skip(skip).limit(per_page)
        total = Consultation._col().count_documents(query)
        return list(cursor), total

    @staticmethod
    def respond(cid, doctor_id, response, status='responded'):
        result = Consultation._col().update_one(
            {'_id': _oid(cid), 'doctorId': _oid(doctor_id)},
            {'$set': {'response': response, 'status': status, 'updatedAt': datetime.utcnow()}},
        )
        return result.modified_count > 0

    @staticmethod
    def assign_doctor(cid, doctor_id):
        Consultation._col().update_one(
            {'_id': _oid(cid)},
            {'$set': {'doctorId': _oid(doctor_id), 'updatedAt': datetime.utcnow()}},
        )
        return Consultation.find_by_id(cid)

    @staticmethod
    def to_public(c, patient=None, doctor=None):
        data = {
            'id': str(c['_id']),
            'patientId': str(c['patientId']),
            'doctorId': str(c['doctorId']) if c.get('doctorId') else None,
            'subject': c['subject'],
            'message': c['message'],
            'status': c['status'],
            'response': c.get('response'),
            'createdAt': c['createdAt'].isoformat(),
            'updatedAt': c['updatedAt'].isoformat(),
        }
        if patient:
            data['patientName'] = patient.get('name')
        if doctor:
            data['doctorName'] = doctor.get('name')
        return data


class Appointment:
    TYPES = ('cardiologist', 'general_physician')
    STATUSES = ('scheduled', 'completed', 'cancelled')

    @staticmethod
    def _col():
        return extensions.db.appointments

    @staticmethod
    def create(user_id, doctor_type, appointment_date, notes='', doctor_id=None):
        doc = {
            'userId': _oid(user_id),
            'doctorId': _oid(doctor_id) if doctor_id else None,
            'doctorType': doctor_type,
            'appointmentDate': datetime.fromisoformat(appointment_date.replace('Z', '')),
            'notes': notes,
            'status': 'scheduled',
            'createdAt': datetime.utcnow(),
        }
        result = Appointment._col().insert_one(doc)
        doc['_id'] = result.inserted_id
        return doc

    @staticmethod
    def find_by_user(user_id, page=1, per_page=20):
        query = {'userId': _oid(user_id)}
        return Appointment._paginate(query, page, per_page)

    @staticmethod
    def find_all(page=1, per_page=20, doctor_type=None):
        query = {}
        if doctor_type:
            query['doctorType'] = doctor_type
        return Appointment._paginate(query, page, per_page)

    @staticmethod
    def _paginate(query, page, per_page):
        skip = (page - 1) * per_page
        cursor = Appointment._col().find(query).sort('appointmentDate', 1).skip(skip).limit(per_page)
        total = Appointment._col().count_documents(query)
        return list(cursor), total

    @staticmethod
    def update_status(aid, user_id, status):
        result = Appointment._col().update_one(
            {'_id': _oid(aid), 'userId': _oid(user_id)},
            {'$set': {'status': status}},
        )
        return result.modified_count > 0

    @staticmethod
    def to_public(a, user=None):
        return {
            'id': str(a['_id']),
            'userId': str(a['userId']),
            'doctorType': a['doctorType'],
            'doctorTypeLabel': 'Cardiologist' if a['doctorType'] == 'cardiologist' else 'General Physician',
            'appointmentDate': a['appointmentDate'].isoformat(),
            'notes': a.get('notes', ''),
            'status': a['status'],
            'createdAt': a['createdAt'].isoformat(),
            'patientName': user.get('name') if user else None,
        }


class Medication:
    @staticmethod
    def _col():
        return extensions.db.medications

    @staticmethod
    def create(user_id, name, dosage, schedule, notes=''):
        doc = {
            'userId': _oid(user_id),
            'name': name,
            'dosage': dosage,
            'schedule': schedule,
            'notes': notes,
            'active': True,
            'createdAt': datetime.utcnow(),
        }
        result = Medication._col().insert_one(doc)
        doc['_id'] = result.inserted_id
        return doc

    @staticmethod
    def find_by_user(user_id, active_only=True):
        query = {'userId': _oid(user_id)}
        if active_only:
            query['active'] = True
        return list(Medication._col().find(query).sort('createdAt', -1))

    @staticmethod
    def update(med_id, user_id, data):
        allowed = {'name', 'dosage', 'schedule', 'notes', 'active'}
        update = {k: v for k, v in data.items() if k in allowed}
        if not update:
            return None
        Medication._col().update_one(
            {'_id': _oid(med_id), 'userId': _oid(user_id)},
            {'$set': update},
        )
        return Medication._col().find_one({'_id': _oid(med_id)})

    @staticmethod
    def delete(med_id, user_id):
        return Medication._col().delete_one({'_id': _oid(med_id), 'userId': _oid(user_id)}).deleted_count > 0

    @staticmethod
    def to_public(m):
        return {
            'id': str(m['_id']),
            'name': m['name'],
            'dosage': m['dosage'],
            'schedule': m['schedule'],
            'notes': m.get('notes', ''),
            'active': m.get('active', True),
            'createdAt': m['createdAt'].isoformat(),
        }


class FamilyHistory:
    DEFAULT = {
        'fatherHeartDisease': False,
        'motherDiabetes': False,
        'fatherDiabetes': False,
        'motherHeartDisease': False,
        'siblingHeartDisease': False,
        'familyHypertension': False,
        'familyStroke': False,
    }

    @staticmethod
    def _col():
        return extensions.db.family_history

    @staticmethod
    def get_or_create(user_id):
        existing = FamilyHistory._col().find_one({'userId': _oid(user_id)})
        if existing:
            return existing
        doc = {'userId': _oid(user_id), **FamilyHistory.DEFAULT, 'updatedAt': datetime.utcnow()}
        result = FamilyHistory._col().insert_one(doc)
        doc['_id'] = result.inserted_id
        return doc

    @staticmethod
    def upsert(user_id, data):
        fields = {k: bool(data[k]) for k in FamilyHistory.DEFAULT if k in data}
        fields['updatedAt'] = datetime.utcnow()
        FamilyHistory._col().update_one(
            {'userId': _oid(user_id)},
            {'$set': fields},
            upsert=True,
        )
        return FamilyHistory.get_or_create(user_id)

    @staticmethod
    def to_public(fh):
        return {
            'id': str(fh['_id']),
            'userId': str(fh['userId']),
            **{k: fh.get(k, False) for k in FamilyHistory.DEFAULT},
            'updatedAt': fh.get('updatedAt', datetime.utcnow()).isoformat(),
        }


class AuditLog:
    @staticmethod
    def _col():
        return extensions.db.audit_logs

    @staticmethod
    def create(user_id, action, details=None, ip=None):
        doc = {
            'userId': _oid(user_id) if user_id else None,
            'action': action,
            'details': details or {},
            'ip': ip,
            'timestamp': datetime.utcnow(),
        }
        result = AuditLog._col().insert_one(doc)
        doc['_id'] = result.inserted_id
        return doc

    @staticmethod
    def find_all(page=1, per_page=50, action=None, user_id=None):
        query = {}
        if action:
            query['action'] = action
        if user_id:
            query['userId'] = _oid(user_id)
        skip = (page - 1) * per_page
        cursor = AuditLog._col().find(query).sort('timestamp', -1).skip(skip).limit(per_page)
        total = AuditLog._col().count_documents(query)
        return list(cursor), total

    @staticmethod
    def to_public(log, user=None):
        return {
            'id': str(log['_id']),
            'userId': str(log['userId']) if log.get('userId') else None,
            'userName': user.get('name') if user else None,
            'action': log['action'],
            'details': log.get('details', {}),
            'ip': log.get('ip'),
            'timestamp': log['timestamp'].isoformat(),
        }


class Notification:
    @staticmethod
    def _col():
        return extensions.db.notifications

    @staticmethod
    def create(user_id, title, message, ntype='info', link=None):
        doc = {
            'userId': _oid(user_id),
            'title': title,
            'message': message,
            'type': ntype,
            'link': link,
            'read': False,
            'createdAt': datetime.utcnow(),
        }
        result = Notification._col().insert_one(doc)
        doc['_id'] = result.inserted_id
        return doc

    @staticmethod
    def find_by_user(user_id, unread_only=False, page=1, per_page=30):
        query = {'userId': _oid(user_id)}
        if unread_only:
            query['read'] = False
        skip = (page - 1) * per_page
        cursor = Notification._col().find(query).sort('createdAt', -1).skip(skip).limit(per_page)
        total = Notification._col().count_documents(query)
        unread = Notification._col().count_documents({'userId': _oid(user_id), 'read': False})
        return list(cursor), total, unread

    @staticmethod
    def mark_read(nid, user_id):
        Notification._col().update_one(
            {'_id': _oid(nid), 'userId': _oid(user_id)},
            {'$set': {'read': True}},
        )

    @staticmethod
    def mark_all_read(user_id):
        Notification._col().update_many(
            {'userId': _oid(user_id), 'read': False},
            {'$set': {'read': True}},
        )

    @staticmethod
    def to_public(n):
        return {
            'id': str(n['_id']),
            'title': n['title'],
            'message': n['message'],
            'type': n['type'],
            'link': n.get('link'),
            'read': n.get('read', False),
            'createdAt': n['createdAt'].isoformat(),
        }
