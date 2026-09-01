from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from enterprise_models import Medication
from services.audit_service import log_action

medications_bp = Blueprint('medications', __name__)


@medications_bp.route('', methods=['GET'])
@jwt_required()
def list_medications():
    user_id = get_jwt_identity()
    active_only = request.args.get('active', 'true').lower() != 'false'
    meds = Medication.find_by_user(user_id, active_only=active_only)
    return jsonify([Medication.to_public(m) for m in meds]), 200


@medications_bp.route('', methods=['POST'])
@jwt_required()
def create_medication():
    user_id = get_jwt_identity()
    data = request.get_json() or {}
    name = data.get('name', '').strip()
    dosage = data.get('dosage', '').strip()
    schedule = data.get('schedule', '').strip()

    if not name or not dosage or not schedule:
        return jsonify({'error': 'name, dosage, and schedule are required'}), 400

    m = Medication.create(user_id, name, dosage, schedule, data.get('notes', ''))
    log_action(user_id, 'medication_added', {'medicationId': str(m['_id']), 'name': name})
    return jsonify(Medication.to_public(m)), 201


@medications_bp.route('/<mid>', methods=['PUT'])
@jwt_required()
def update_medication(mid):
    user_id = get_jwt_identity()
    updated = Medication.update(mid, user_id, request.get_json() or {})
    if not updated:
        return jsonify({'error': 'Medication not found'}), 404
    return jsonify(Medication.to_public(updated)), 200


@medications_bp.route('/<mid>', methods=['DELETE'])
@jwt_required()
def delete_medication(mid):
    user_id = get_jwt_identity()
    if Medication.delete(mid, user_id):
        log_action(user_id, 'medication_deleted', {'medicationId': mid})
        return jsonify({'message': 'Deleted'}), 200
    return jsonify({'error': 'Not found'}), 404
