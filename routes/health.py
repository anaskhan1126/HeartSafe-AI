from flask import Blueprint, jsonify
import extensions


health_bp = Blueprint('health', __name__)


@health_bp.route('/health', methods=['GET'])
def health():
    try:
        extensions.db.client.admin.command('ping')
        mongo_status = 'connected'
    except Exception:
        mongo_status = 'disconnected'
    return jsonify({'status': 'ok', 'mongodb': mongo_status}), 200
