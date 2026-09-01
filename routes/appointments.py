from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from middleware.rbac import role_required
from models import User
from enterprise_models import Appointment
from services.audit_service import log_action
from services.notification_service import notify_appointment

appointments_bp = Blueprint('appointments', __name__)


@appointments_bp.route('', methods=['GET'])
@jwt_required()
def list_appointments():
    user_id = get_jwt_identity()
    role = get_jwt().get('role', 'patient')
    page = max(1, int(request.args.get('page', 1)))

    if role == 'admin':
        items, total = Appointment.find_all(page, doctor_type=request.args.get('type'))
        result = []
        for a in items:
            user = User.find_by_id(str(a['userId']))
            result.append(Appointment.to_public(a, user))
    else:
        items, total = Appointment.find_by_user(user_id, page)
        result = [Appointment.to_public(a) for a in items]

    return jsonify({
        'appointments': result,
        'pagination': {'page': page, 'total': total},
    }), 200


@appointments_bp.route('', methods=['POST'])
@jwt_required()
def create_appointment():
    user_id = get_jwt_identity()
    data = request.get_json() or {}
    doctor_type = data.get('doctorType', '').lower()
    appointment_date = data.get('appointmentDate')
    notes = data.get('notes', '')

    if doctor_type not in Appointment.TYPES:
        return jsonify({'error': 'doctorType must be cardiologist or general_physician'}), 400
    if not appointment_date:
        return jsonify({'error': 'appointmentDate is required'}), 400

    a = Appointment.create(user_id, doctor_type, appointment_date, notes)
    log_action(user_id, 'appointment_scheduled', {'appointmentId': str(a['_id']), 'type': doctor_type})
    notify_appointment(user_id, doctor_type, a['appointmentDate'].strftime('%Y-%m-%d %H:%M'))

    return jsonify(Appointment.to_public(a)), 201


@appointments_bp.route('/<aid>/cancel', methods=['PUT'])
@jwt_required()
def cancel_appointment(aid):
    user_id = get_jwt_identity()
    if Appointment.update_status(aid, user_id, 'cancelled'):
        log_action(user_id, 'appointment_cancelled', {'appointmentId': aid})
        return jsonify({'message': 'Appointment cancelled'}), 200
    return jsonify({'error': 'Appointment not found'}), 404
