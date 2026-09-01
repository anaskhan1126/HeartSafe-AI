from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from werkzeug.security import check_password_hash
from models import User, PredictionRecord
from services.audit_service import log_login, log_action

auth_bp = Blueprint('auth', __name__)


def _token_response(user):
    access_token = create_access_token(
        identity=str(user['_id']),
        additional_claims={'role': user.get('role', 'patient')},
    )
    return {
        'token': access_token,
        'user': User.to_public(user),
    }


@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json() or {}
    name = data.get('name', '').strip()
    email = data.get('email', '').strip()
    password = data.get('password', '')

    if not name or not email or not password:
        return jsonify({'error': 'Name, email, and password are required'}), 400
    if len(password) < 6:
        return jsonify({'error': 'Password must be at least 6 characters'}), 400
    if User.find_by_email(email):
        return jsonify({'error': 'Email already exists'}), 400

    role = data.get('role', 'patient')
    if role != 'patient':
        return jsonify({'error': 'Only patient registration is allowed'}), 400

    user = User.create(name=name, email=email, password=password, role='patient')
    log_action(str(user['_id']), 'register', {'email': email})
    return jsonify(_token_response(user)), 201


@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    user = User.find_by_email(data.get('email', ''))

    if not user or not check_password_hash(user['password'], data.get('password', '')):
        return jsonify({'error': 'Invalid credentials'}), 401

    log_login(str(user['_id']), user['email'])
    return jsonify(_token_response(user)), 200


@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    user_id = get_jwt_identity()
    user = User.find_by_id(user_id)

    if not user:
        return jsonify({'error': 'User not found'}), 404

    public = User.to_public(user)
    public['predictionCount'] = PredictionRecord.count_by_user(user_id)
    return jsonify(public), 200
