from flask import request
from enterprise_models import AuditLog


def log_action(user_id, action, details=None):
    ip = request.remote_addr if request else None
    return AuditLog.create(user_id, action, details, ip)


def log_login(user_id, email):
    log_action(user_id, 'login', {'email': email})


def log_prediction(user_id, record_id, prediction, probability):
    log_action(user_id, 'prediction_created', {
        'recordId': record_id,
        'prediction': prediction,
        'probability': probability,
    })


def log_export(user_id, export_type, fmt):
    log_action(user_id, 'export_generated', {'type': export_type, 'format': fmt})
