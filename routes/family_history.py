from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from enterprise_models import FamilyHistory
from services.audit_service import log_action

family_history_bp = Blueprint('family_history', __name__)


@family_history_bp.route('', methods=['GET'])
@jwt_required()
def get_family_history():
    user_id = get_jwt_identity()
    fh = FamilyHistory.get_or_create(user_id)
    return jsonify(FamilyHistory.to_public(fh)), 200


@family_history_bp.route('', methods=['PUT'])
@jwt_required()
def update_family_history():
    user_id = get_jwt_identity()
    data = request.get_json() or {}
    fh = FamilyHistory.upsert(user_id, data)
    log_action(user_id, 'family_history_updated', FamilyHistory.to_public(fh))
    return jsonify(FamilyHistory.to_public(fh)), 200
