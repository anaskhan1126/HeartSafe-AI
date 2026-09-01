from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from enterprise_models import Notification

notifications_bp = Blueprint('notifications', __name__)


@notifications_bp.route('', methods=['GET'])
@jwt_required()
def list_notifications():
    user_id = get_jwt_identity()
    page = max(1, int(request.args.get('page', 1)))
    unread_only = request.args.get('unread', 'false').lower() == 'true'
    items, total, unread = Notification.find_by_user(user_id, unread_only, page)
    return jsonify({
        'notifications': [Notification.to_public(n) for n in items],
        'unreadCount': unread,
        'pagination': {'page': page, 'total': total},
    }), 200


@notifications_bp.route('/<nid>/read', methods=['PUT'])
@jwt_required()
def mark_read(nid):
    user_id = get_jwt_identity()
    Notification.mark_read(nid, user_id)
    return jsonify({'message': 'Marked as read'}), 200


@notifications_bp.route('/read-all', methods=['PUT'])
@jwt_required()
def mark_all_read():
    user_id = get_jwt_identity()
    Notification.mark_all_read(user_id)
    return jsonify({'message': 'All marked as read'}), 200
