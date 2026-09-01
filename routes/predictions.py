from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from models import User, PredictionRecord
from services.prediction_service import make_prediction, validate_prediction_input, ModelNotFoundError
from services.family_history_service import apply_family_history_adjustment, get_emergency_guidance
from services.audit_service import log_prediction
from services.notification_service import notify_prediction_complete, notify_new_report
from services.email_service import send_prediction_report
from services.export_service import export_predictions_pdf

predictions_bp = Blueprint('predictions', __name__)


def _parse_pagination():
    page = max(1, int(request.args.get('page', 1)))
    per_page = min(100, max(1, int(request.args.get('per_page', 10))))
    sort_by = request.args.get('sort_by', 'timestamp')
    sort_order = request.args.get('sort_order', 'desc')
    return page, per_page, sort_by, sort_order


@predictions_bp.route('/predict', methods=['POST'])
@jwt_required()
def predict_api():
    user_id = get_jwt_identity()
    data = request.get_json() or {}

    errors = validate_prediction_input(data)
    if errors:
        return jsonify({'error': 'Validation failed', 'details': errors}), 400

    try:
        pred, probability, inputs = make_prediction(data)
    except ModelNotFoundError as e:
        return jsonify({'error': str(e)}), 503

    adjusted_prob, adjusted_pred, fh_meta = apply_family_history_adjustment(user_id, probability, pred)

    record = PredictionRecord.create(
        user_id=user_id,
        inputs={**inputs, 'familyHistoryAdjustment': fh_meta},
        prediction=adjusted_pred,
        probability=adjusted_prob,
    )

    record_id = str(record['_id'])
    log_prediction(user_id, record_id, adjusted_pred, adjusted_prob)
    notify_prediction_complete(user_id, adjusted_pred, adjusted_prob, record_id)
    notify_new_report(user_id, record_id)

    emergency = get_emergency_guidance(adjusted_prob, adjusted_pred)

    user = User.find_by_id(user_id)
    if user and user.get('email'):
        try:
            pdf = export_predictions_pdf([record], title='HeartAI Medical Report')
            send_prediction_report(user, record, pdf)
        except Exception:
            pass

    return jsonify({
        'prediction': adjusted_pred,
        'probability': adjusted_prob,
        'recordId': record_id,
        'timestamp': record['timestamp'].isoformat(),
        'inputs': inputs,
        'familyHistoryImpact': fh_meta,
        'emergency': emergency,
        'emailSent': bool(user and user.get('email')),
    }), 200


@predictions_bp.route('/records', methods=['GET'])
@jwt_required()
def get_records():
    user_id = get_jwt_identity()
    claims = get_jwt()
    role = claims.get('role', 'patient')
    page, per_page, sort_by, sort_order = _parse_pagination()

    prediction_filter = request.args.get('prediction')
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')

    filters = PredictionRecord.build_date_filter(start_date, end_date)
    if prediction_filter in ('High Risk', 'Low Risk'):
        filters['prediction'] = prediction_filter

    if role == 'admin':
        patient_id = request.args.get('patient_id')
        if patient_id:
            records, total = PredictionRecord.find_by_user(
                patient_id, page, per_page, filters, sort_by, sort_order
            )
        else:
            records, total = PredictionRecord.find_all(
                page, per_page, filters, sort_by, sort_order
            )
    elif role == 'doctor':
        patients, _ = User.find_patients_by_doctor(user_id, page=1, per_page=1000)
        patient_ids = [str(p['_id']) for p in patients]
        patient_id = request.args.get('patient_id')
        if patient_id and patient_id in patient_ids:
            patient_ids = [patient_id]
        records, total = PredictionRecord.find_by_users(
            patient_ids, page, per_page, filters, sort_by, sort_order
        )
        patient_map = {str(p['_id']): p['name'] for p in patients}
        result = [
            PredictionRecord.to_public(r, include_user=True, user={'name': patient_map.get(str(r['userId']))})
            for r in records
        ]
        return jsonify({
            'records': result,
            'pagination': {'page': page, 'per_page': per_page, 'total': total,
                           'pages': (total + per_page - 1) // per_page},
        }), 200
    else:
        records, total = PredictionRecord.find_by_user(
            user_id, page, per_page, filters, sort_by, sort_order
        )

    result = [PredictionRecord.to_public(r) for r in records]
    return jsonify({
        'records': result,
        'pagination': {'page': page, 'per_page': per_page, 'total': total,
                       'pages': (total + per_page - 1) // per_page},
    }), 200


@predictions_bp.route('/records/<record_id>', methods=['DELETE'])
@jwt_required()
def delete_record(record_id):
    user_id = get_jwt_identity()
    claims = get_jwt()
    role = claims.get('role', 'patient')

    if role == 'admin':
        deleted = PredictionRecord.delete(record_id)
    else:
        deleted = PredictionRecord.delete(record_id, user_id)

    if deleted:
        return jsonify({'message': 'Record deleted'}), 200
    return jsonify({'error': 'Record not found'}), 404


@predictions_bp.route('/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    user_id = get_jwt_identity()
    data = request.get_json() or {}

    if data.get('password') and len(data['password']) < 6:
        return jsonify({'error': 'Password must be at least 6 characters'}), 400

    user = User.update(user_id, data)

    if not user:
        return jsonify({'error': 'User not found'}), 404

    public = User.to_public(user)
    public['predictionCount'] = PredictionRecord.count_by_user(user_id)
    return jsonify(public), 200
