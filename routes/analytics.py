from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from middleware.rbac import role_required
from models import User
from services.analytics_service import (
    get_dashboard_stats, get_full_analytics, get_population_analytics,
)

analytics_bp = Blueprint('analytics', __name__)


def _resolve_user_ids():
    claims = get_jwt()
    role = claims.get('role', 'patient')
    user_id = get_jwt_identity()

    if role == 'admin':
        patient_id = request.args.get('patient_id')
        if patient_id:
            return [patient_id]
        return None
    if role == 'doctor':
        patients, _ = User.find_patients_by_doctor(user_id, page=1, per_page=1000)
        return [str(p['_id']) for p in patients]
    return [user_id]


@analytics_bp.route('/dashboard', methods=['GET'])
@jwt_required()
def dashboard():
    user_ids = _resolve_user_ids()
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    stats = get_dashboard_stats(user_ids, start_date, end_date)
    return jsonify(stats), 200


@analytics_bp.route('/full', methods=['GET'])
@jwt_required()
def full_analytics():
    user_ids = _resolve_user_ids()
    return jsonify(get_full_analytics(user_ids)), 200


@analytics_bp.route('/population', methods=['GET'])
@jwt_required()
@role_required('admin')
def population():
    return jsonify(get_population_analytics()), 200
