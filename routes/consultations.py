from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from middleware.rbac import role_required
from models import User
from enterprise_models import Consultation
from services.audit_service import log_action
from services.notification_service import notify_consultation_request, notify_consultation_response

consultations_bp = Blueprint('consultations', __name__)


@consultations_bp.route('', methods=['GET'])
@jwt_required()
def list_consultations():
    user_id = get_jwt_identity()
    role = get_jwt().get('role', 'patient')
    page = max(1, int(request.args.get('page', 1)))

    if role == 'admin':
        items, total = Consultation.find_all(page)
    elif role == 'doctor':
        items, total = Consultation.find_for_doctor(user_id, page, status=request.args.get('status'))
    else:
        items, total = Consultation.find_for_patient(user_id, page)

    result = []
    for c in items:
        patient = User.find_by_id(str(c['patientId']))
        doctor = User.find_by_id(str(c['doctorId'])) if c.get('doctorId') else None
        result.append(Consultation.to_public(c, patient, doctor))

    return jsonify({
        'consultations': result,
        'pagination': {'page': page, 'total': total, 'pages': (total + 19) // 20},
    }), 200


@consultations_bp.route('', methods=['POST'])
@jwt_required()
@role_required('patient')
def create_consultation():
    user_id = get_jwt_identity()
    data = request.get_json() or {}
    subject = data.get('subject', '').strip()
    message = data.get('message', '').strip()
    doctor_id = data.get('doctorId')

    if not subject or not message:
        return jsonify({'error': 'Subject and message are required'}), 400

    user = User.find_by_id(user_id)
    if not doctor_id and user.get('assignedDoctorId'):
        doctor_id = str(user['assignedDoctorId'])

    c = Consultation.create(user_id, doctor_id, subject, message)
    log_action(user_id, 'consultation_requested', {'consultationId': str(c['_id'])})

    if doctor_id:
        doctor = User.find_by_id(doctor_id)
        if doctor:
            notify_consultation_request(doctor_id, user['name'])

    patient = User.find_by_id(user_id)
    doctor = User.find_by_id(doctor_id) if doctor_id else None
    return jsonify(Consultation.to_public(c, patient, doctor)), 201


@consultations_bp.route('/<cid>/respond', methods=['PUT'])
@jwt_required()
@role_required('doctor')
def respond_consultation(cid):
    doctor_id = get_jwt_identity()
    data = request.get_json() or {}
    response = data.get('response', '').strip()
    if not response:
        return jsonify({'error': 'Response is required'}), 400

    c = Consultation.find_by_id(cid)
    if not c:
        return jsonify({'error': 'Consultation not found'}), 404
    if str(c.get('doctorId', '')) != doctor_id:
        if c.get('doctorId') is None:
            Consultation.assign_doctor(cid, doctor_id)
        else:
            return jsonify({'error': 'Not assigned to this consultation'}), 403

    if not Consultation.respond(cid, doctor_id, response):
        return jsonify({'error': 'Failed to respond'}), 400

    log_action(doctor_id, 'consultation_responded', {'consultationId': cid})
    doctor = User.find_by_id(doctor_id)
    notify_consultation_response(str(c['patientId']), doctor['name'])

    updated = Consultation.find_by_id(cid)
    patient = User.find_by_id(str(updated['patientId']))
    return jsonify(Consultation.to_public(updated, patient, doctor)), 200
