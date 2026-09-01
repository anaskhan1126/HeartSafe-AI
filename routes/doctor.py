from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from middleware.rbac import role_required
from models import User, PredictionRecord
from services.analytics_service import get_full_analytics, get_dashboard_stats

doctor_bp = Blueprint('doctor', __name__)


@doctor_bp.route('/patients', methods=['GET'])
@jwt_required()
@role_required('doctor')
def list_patients():
    doctor_id = get_jwt_identity()
    page = max(1, int(request.args.get('page', 1)))
    per_page = min(100, max(1, int(request.args.get('per_page', 10))))

    patients, total = User.find_patients_by_doctor(doctor_id, page, per_page)
    result = []
    for p in patients:
        pub = User.to_public(p)
        pub['predictionCount'] = PredictionRecord.count_by_user(str(p['_id']))
        result.append(pub)

    return jsonify({
        'patients': result,
        'pagination': {'page': page, 'per_page': per_page, 'total': total,
                       'pages': (total + per_page - 1) // per_page},
    }), 200


@doctor_bp.route('/patients/<patient_id>/records', methods=['GET'])
@jwt_required()
@role_required('doctor')
def patient_records(patient_id):
    doctor_id = get_jwt_identity()
    patient = User.find_by_id(patient_id)

    if not patient or str(patient.get('assignedDoctorId', '')) != doctor_id:
        return jsonify({'error': 'Patient not found or not assigned'}), 404

    page = max(1, int(request.args.get('page', 1)))
    per_page = min(100, max(1, int(request.args.get('per_page', 10))))
    records, total = PredictionRecord.find_by_user(patient_id, page, per_page)

    return jsonify({
        'records': [PredictionRecord.to_public(r) for r in records],
        'patient': User.to_public(patient),
        'pagination': {'page': page, 'per_page': per_page, 'total': total,
                       'pages': (total + per_page - 1) // per_page},
    }), 200


@doctor_bp.route('/analytics', methods=['GET'])
@jwt_required()
@role_required('doctor')
def doctor_analytics():
    doctor_id = get_jwt_identity()
    patients, _ = User.find_patients_by_doctor(doctor_id, page=1, per_page=1000)
    patient_ids = [str(p['_id']) for p in patients]
    return jsonify({
        'stats': get_dashboard_stats(patient_ids),
        'analytics': get_full_analytics(patient_ids),
        'patientCount': len(patient_ids),
    }), 200
