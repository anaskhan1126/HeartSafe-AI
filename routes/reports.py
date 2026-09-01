from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from models import PredictionRecord, User
from services.summarization_service import summarize_report, SUPPORTED_LANGUAGES

reports_bp = Blueprint('reports', __name__)


@reports_bp.route('/summarize', methods=['POST'])
@jwt_required()
def summarize():
    data = request.get_json() or {}
    language = data.get('language', 'en')

    if language not in SUPPORTED_LANGUAGES:
        return jsonify({'error': f'Unsupported language. Use: {", ".join(SUPPORTED_LANGUAGES)}'}), 400

    record_id = data.get('recordId')
    if record_id:
        record = PredictionRecord.find_by_id(record_id)
        if not record:
            return jsonify({'error': 'Record not found'}), 404

        user_id = get_jwt_identity()
        claims = get_jwt()
        role = claims.get('role', 'patient')

        if role == 'patient' and str(record['userId']) != user_id:
            return jsonify({'error': 'Forbidden'}), 403
        if role == 'doctor':
            patient = User.find_by_id(str(record['userId']))
            if not patient or str(patient.get('assignedDoctorId', '')) != user_id:
                return jsonify({'error': 'Forbidden'}), 403

        inputs = record['inputs']
        prediction = record['prediction']
        probability = record['probability']
    else:
        inputs = data.get('inputs')
        prediction = data.get('prediction')
        probability = data.get('probability')

        if not inputs or not prediction:
            return jsonify({'error': 'Provide recordId or inputs/prediction/probability'}), 400

    result = summarize_report(inputs, prediction, probability, language)
    return jsonify(result), 200
