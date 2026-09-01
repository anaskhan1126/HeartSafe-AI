from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from middleware.rbac import role_required
from models import User
from enterprise_models import AuditLog

audit_bp = Blueprint('audit', __name__)


@audit_bp.route('', methods=['GET'])
@jwt_required()
@role_required('admin')
def list_audit_logs():
    page = max(1, int(request.args.get('page', 1)))
    per_page = min(100, max(1, int(request.args.get('per_page', 50))))
    action = request.args.get('action')
    user_id = request.args.get('user_id')

    logs, total = AuditLog.find_all(page, per_page, action, user_id)
    result = []
    for log in logs:
        user = User.find_by_id(str(log['userId'])) if log.get('userId') else None
        result.append(AuditLog.to_public(log, user))

    return jsonify({
        'logs': result,
        'pagination': {'page': page, 'per_page': per_page, 'total': total,
                         'pages': (total + per_page - 1) // per_page},
    }), 200
