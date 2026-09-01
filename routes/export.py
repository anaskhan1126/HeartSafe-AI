from flask import Blueprint, request, jsonify, send_file
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from middleware.rbac import role_required
from services.export_service import (
    export_predictions_csv, export_predictions_excel, export_predictions_pdf,
    export_analytics_csv, export_analytics_excel, export_analytics_pdf,
    export_population_pdf, fetch_records_for_export,
)
from models import User
from services.analytics_service import get_population_analytics
from services.audit_service import log_export
import pandas as pd
import io

export_bp = Blueprint('export', __name__)

MIME_TYPES = {
    'csv': 'text/csv',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'pdf': 'application/pdf',
}


def _get_user_ids_for_analytics(role, user_id):
    if role == 'admin':
        return None
    if role == 'doctor':
        patients, _ = User.find_patients_by_doctor(user_id, page=1, per_page=1000)
        return [str(p['_id']) for p in patients]
    return [user_id]


@export_bp.route('/predictions', methods=['GET'])
@jwt_required()
def export_predictions():
    user_id = get_jwt_identity()
    claims = get_jwt()
    role = claims.get('role', 'patient')
    fmt = request.args.get('format', 'csv').lower()
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    patient_id = request.args.get('patient_id')

    if fmt not in MIME_TYPES:
        return jsonify({'error': 'Invalid format. Use csv, xlsx, or pdf'}), 400

    records = fetch_records_for_export(user_id, role, start_date, end_date, patient_id)
    include_patient = role in ('doctor', 'admin')

    if fmt == 'csv':
        output = export_predictions_csv(records if not include_patient else
            [{**r, 'patientName': r.get('patientName')} for r in records])
        filename = 'predictions.csv'
    elif fmt == 'xlsx':
        from services.export_service import _records_to_rows
        rows = _records_to_rows(records, include_patient=include_patient)
        for i, r in enumerate(records):
            if include_patient and 'patientName' in r:
                rows[i]['Patient'] = r['patientName']
        df = pd.DataFrame(rows)
        output = io.BytesIO()
        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            df.to_excel(writer, index=False, sheet_name='Predictions')
        output.seek(0)
        filename = 'predictions.xlsx'
    else:
        output = export_predictions_pdf(records)
        filename = 'predictions.pdf'

    log_export(user_id, 'predictions', fmt)
    return send_file(output, mimetype=MIME_TYPES[fmt], as_attachment=True, download_name=filename)


@export_bp.route('/analytics', methods=['GET'])
@jwt_required()
def export_analytics():
    user_id = get_jwt_identity()
    claims = get_jwt()
    role = claims.get('role', 'patient')
    fmt = request.args.get('format', 'csv').lower()

    if fmt not in MIME_TYPES:
        return jsonify({'error': 'Invalid format. Use csv, xlsx, or pdf'}), 400

    user_ids = _get_user_ids_for_analytics(role, user_id)

    if fmt == 'csv':
        output = export_analytics_csv(user_ids)
        filename = 'analytics.csv'
    elif fmt == 'xlsx':
        output = export_analytics_excel(user_ids)
        filename = 'analytics.xlsx'
    else:
        output = export_analytics_pdf(user_ids)
        filename = 'analytics.pdf'

    log_export(user_id, 'analytics', fmt)
    return send_file(output, mimetype=MIME_TYPES[fmt], as_attachment=True, download_name=filename)


@export_bp.route('/population', methods=['GET'])
@jwt_required()
@role_required('admin')
def export_population():
    user_id = get_jwt_identity()
    fmt = request.args.get('format', 'csv').lower()

    if fmt == 'csv':
        pop = get_population_analytics()
        rows = [{'Metric': k, 'Value': v} for k, v in pop.items() if k != 'mostCommonRiskFactors']
        for rf in pop.get('mostCommonRiskFactors', []):
            rows.append({'Metric': rf['factor'], 'Value': rf['count']})
        output = io.BytesIO()
        pd.DataFrame(rows).to_csv(output, index=False)
        output.seek(0)
        filename = 'population_analytics.csv'
    elif fmt == 'xlsx':
        pop = get_population_analytics()
        output = io.BytesIO()
        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            pd.DataFrame([{k: v for k, v in pop.items() if k != 'mostCommonRiskFactors'}]).to_excel(
                writer, sheet_name='Summary', index=False)
            pd.DataFrame(pop.get('mostCommonRiskFactors', [])).to_excel(
                writer, sheet_name='Risk Factors', index=False)
        output.seek(0)
        filename = 'population_analytics.xlsx'
    else:
        output = export_population_pdf()
        filename = 'population_analytics.pdf'

    log_export(user_id, 'population', fmt)
    return send_file(output, mimetype=MIME_TYPES.get(fmt, 'application/octet-stream'),
                     as_attachment=True, download_name=filename)


@export_bp.route('/reports/<record_id>', methods=['GET'])
@jwt_required()
def export_single_report(record_id):
    from models import PredictionRecord
    user_id = get_jwt_identity()
    claims = get_jwt()
    role = claims.get('role', 'patient')
    fmt = request.args.get('format', 'pdf').lower()

    record = PredictionRecord.find_by_id(record_id)
    if not record:
        return jsonify({'error': 'Record not found'}), 404

    if role == 'patient' and str(record['userId']) != user_id:
        return jsonify({'error': 'Forbidden'}), 403
    if role == 'doctor':
        patient = User.find_by_id(str(record['userId']))
        if not patient or str(patient.get('assignedDoctorId', '')) != user_id:
            return jsonify({'error': 'Forbidden'}), 403

    if fmt == 'pdf':
        output = export_predictions_pdf([record], title='Medical Prediction Report')
        filename = f'report_{record_id}.pdf'
        log_export(user_id, 'report', fmt)
        return send_file(output, mimetype='application/pdf', as_attachment=True, download_name=filename)

    rows = [{'field': k, 'value': v} for k, v in record['inputs'].items()]
    rows.extend([
        {'field': 'Prediction', 'value': record['prediction']},
        {'field': 'Probability', 'value': f"{record['probability']}%"},
        {'field': 'Date', 'value': record['timestamp'].isoformat()},
    ])
    if fmt == 'csv':
        output = io.BytesIO()
        pd.DataFrame(rows).to_csv(output, index=False)
        output.seek(0)
        log_export(user_id, 'report', fmt)
        return send_file(output, mimetype='text/csv', as_attachment=True,
                         download_name=f'report_{record_id}.csv')
    if fmt == 'xlsx':
        output = io.BytesIO()
        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            pd.DataFrame(rows).to_excel(writer, index=False, sheet_name='Report')
        output.seek(0)
        log_export(user_id, 'report', fmt)
        return send_file(output, mimetype=MIME_TYPES['xlsx'], as_attachment=True,
                         download_name=f'report_{record_id}.xlsx')

    return jsonify({'error': 'Invalid format'}), 400
