from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from werkzeug.security import generate_password_hash
from middleware.rbac import role_required
from models import User, PredictionRecord
from services.analytics_service import get_dashboard_stats, get_population_analytics

admin_bp = Blueprint('admin', __name__)


def _parse_pagination():
    page = max(1, int(request.args.get('page', 1)))
    per_page = min(100, max(1, int(request.args.get('per_page', 10))))
    sort_by = request.args.get('sort_by', 'createdAt')
    sort_order = request.args.get('sort_order', 'desc')
    return page, per_page, sort_by, sort_order


@admin_bp.route('/users', methods=['GET'])
@jwt_required()
@role_required('admin')
def list_users():
    page, per_page, sort_by, sort_order = _parse_pagination()
    filters = {}
    role = request.args.get('role')
    search = request.args.get('search', '').strip()
    if role:
        filters['role'] = role
    if search:
        filters['$or'] = [
            {'name': {'$regex': search, '$options': 'i'}},
            {'email': {'$regex': search, '$options': 'i'}},
        ]
    users, total = User.find_all(filters, page, per_page, sort_by, sort_order)
    return jsonify({
        'users': [User.to_public(u) for u in users],
        'pagination': {'page': page, 'per_page': per_page, 'total': total,
                       'pages': (total + per_page - 1) // per_page},
    }), 200


@admin_bp.route('/users', methods=['POST'])
@jwt_required()
@role_required('admin')
def create_user():
    data = request.get_json() or {}
    name = data.get('name', '').strip()
    email = data.get('email', '').strip()
    password = data.get('password', '')
    role = data.get('role', 'patient')

    if not name or not email or not password:
        return jsonify({'error': 'Name, email, and password are required'}), 400
    if role not in ('patient', 'doctor', 'admin'):
        return jsonify({'error': 'Invalid role'}), 400
    if User.find_by_email(email):
        return jsonify({'error': 'Email already exists'}), 400

    assigned_doctor_id = data.get('assignedDoctorId')
    user = User.create(name, email, password, role, assigned_doctor_id)
    return jsonify(User.to_public(user)), 201


@admin_bp.route('/users/<user_id>', methods=['PUT'])
@jwt_required()
@role_required('admin')
def update_user(user_id):
    data = request.get_json() or {}
    if 'role' in data and data['role'] not in ('patient', 'doctor', 'admin'):
        return jsonify({'error': 'Invalid role'}), 400
    user = User.update(user_id, data)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    return jsonify(User.to_public(user)), 200


@admin_bp.route('/users/<user_id>', methods=['DELETE'])
@jwt_required()
@role_required('admin')
def delete_user(user_id):
    if User.delete(user_id):
        return jsonify({'message': 'User deleted'}), 200
    return jsonify({'error': 'User not found'}), 404


@admin_bp.route('/doctors', methods=['GET'])
@jwt_required()
@role_required('admin')
def list_doctors():
    page, per_page, sort_by, sort_order = _parse_pagination()
    doctors, total = User.find_doctors(page, per_page)
    result = []
    for d in doctors:
        pub = User.to_public(d)
        patients, patient_total = User.find_patients_by_doctor(str(d['_id']), 1, 1)
        pub['patientCount'] = patient_total
        result.append(pub)
    return jsonify({
        'doctors': result,
        'pagination': {'page': page, 'per_page': per_page, 'total': total,
                       'pages': (total + per_page - 1) // per_page},
    }), 200


@admin_bp.route('/assign-patient', methods=['POST'])
@jwt_required()
@role_required('admin')
def assign_patient():
    data = request.get_json() or {}
    patient_id = data.get('patientId')
    doctor_id = data.get('doctorId')

    if not patient_id:
        return jsonify({'error': 'patientId is required'}), 400

    patient = User.find_by_id(patient_id)
    if not patient or patient.get('role') != 'patient':
        return jsonify({'error': 'Patient not found'}), 404

    if doctor_id:
        doctor = User.find_by_id(doctor_id)
        if not doctor or doctor.get('role') != 'doctor':
            return jsonify({'error': 'Doctor not found'}), 404

    user = User.update(patient_id, {'assignedDoctorId': doctor_id})
    return jsonify(User.to_public(user)), 200


@admin_bp.route('/analytics', methods=['GET'])
@jwt_required()
@role_required('admin')
def system_analytics():
    return jsonify({
        'stats': get_dashboard_stats(),
        'population': get_population_analytics(),
        'userCounts': {
            'patients': User.count_by_role('patient'),
            'doctors': User.count_by_role('doctor'),
            'admins': User.count_by_role('admin'),
        },
    }), 200
