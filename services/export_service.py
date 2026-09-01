import io
from datetime import datetime
import pandas as pd
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from models import PredictionRecord, User
from services.analytics_service import get_dashboard_stats, get_population_analytics, get_full_analytics


def _records_to_rows(records, include_patient=False):
    rows = []
    for r in records:
        row = {
            'Date': r['timestamp'].strftime('%Y-%m-%d %H:%M') if hasattr(r['timestamp'], 'strftime')
                    else r.get('timestamp', ''),
            'Prediction': r['prediction'],
            'Probability (%)': r['probability'],
            'Age': r['inputs'].get('Age'),
            'Sex': r['inputs'].get('Sex'),
            'Resting BP': r['inputs'].get('RestingBP'),
            'Cholesterol': r['inputs'].get('Cholesterol'),
            'Max HR': r['inputs'].get('MaxHR'),
            'Chest Pain': r['inputs'].get('ChestPainType'),
            'Exercise Angina': r['inputs'].get('ExerciseAngina'),
            'ST Slope': r['inputs'].get('ST_Slope'),
        }
        if include_patient and 'patientName' in r:
            row['Patient'] = r['patientName']
        rows.append(row)
    return rows


def export_predictions_csv(records):
    df = pd.DataFrame(_records_to_rows(records))
    output = io.BytesIO()
    df.to_csv(output, index=False)
    output.seek(0)
    return output


def export_predictions_excel(records):
    df = pd.DataFrame(_records_to_rows(records))
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        df.to_excel(writer, index=False, sheet_name='Predictions')
    output.seek(0)
    return output


def export_predictions_pdf(records, title='Prediction History Report'):
    output = io.BytesIO()
    doc = SimpleDocTemplate(output, pagesize=letter)
    styles = getSampleStyleSheet()
    elements = [
        Paragraph(title, styles['Title']),
        Spacer(1, 0.2 * inch),
        Paragraph(f'Generated: {datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC")}', styles['Normal']),
        Spacer(1, 0.3 * inch),
    ]
    rows = _records_to_rows(records)
    if rows:
        headers = list(rows[0].keys())
        table_data = [headers] + [[str(row.get(h, '')) for h in headers] for row in rows[:50]]
        table = Table(table_data, repeatRows=1)
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#dc2626')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTSIZE', (0, 0), (-1, -1), 8),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#fef2f2')]),
        ]))
        elements.append(table)
        if len(rows) > 50:
            elements.append(Spacer(1, 0.2 * inch))
            elements.append(Paragraph(f'Showing 50 of {len(rows)} records.', styles['Italic']))
    else:
        elements.append(Paragraph('No records found.', styles['Normal']))
    doc.build(elements)
    output.seek(0)
    return output


def export_analytics_csv(user_ids=None):
    analytics = get_full_analytics(user_ids)
    stats = analytics['stats']
    rows = [
        {'Metric': k, 'Value': v} for k, v in stats.items()
    ]
    for item in analytics.get('riskDistribution', []):
        rows.append({'Metric': f"Risk - {item['name']}", 'Value': item['value']})
    df = pd.DataFrame(rows)
    output = io.BytesIO()
    df.to_csv(output, index=False)
    output.seek(0)
    return output


def export_analytics_excel(user_ids=None):
    analytics = get_full_analytics(user_ids)
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        pd.DataFrame([analytics['stats']]).to_excel(writer, sheet_name='Summary', index=False)
        pd.DataFrame(analytics['daily']).to_excel(writer, sheet_name='Daily', index=False)
        pd.DataFrame(analytics['weekly']).to_excel(writer, sheet_name='Weekly', index=False)
        pd.DataFrame(analytics['monthly']).to_excel(writer, sheet_name='Monthly', index=False)
        pd.DataFrame(analytics['riskDistribution']).to_excel(writer, sheet_name='Risk', index=False)
        pd.DataFrame(analytics['ageDistribution']).to_excel(writer, sheet_name='Age', index=False)
        pd.DataFrame(analytics['genderDistribution']).to_excel(writer, sheet_name='Gender', index=False)
    output.seek(0)
    return output


def export_analytics_pdf(user_ids=None, title='Analytics Report'):
    analytics = get_full_analytics(user_ids)
    stats = analytics['stats']
    output = io.BytesIO()
    doc = SimpleDocTemplate(output, pagesize=letter)
    styles = getSampleStyleSheet()
    elements = [
        Paragraph(title, styles['Title']),
        Spacer(1, 0.2 * inch),
    ]
    table_data = [['Metric', 'Value']] + [[k, str(v)] for k, v in stats.items()]
    table = Table(table_data, colWidths=[3 * inch, 2 * inch])
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#dc2626')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
    ]))
    elements.append(table)
    doc.build(elements)
    output.seek(0)
    return output


def export_population_pdf():
    pop = get_population_analytics()
    output = io.BytesIO()
    doc = SimpleDocTemplate(output, pagesize=letter)
    styles = getSampleStyleSheet()
    elements = [
        Paragraph('Population Analytics Report (Anonymized)', styles['Title']),
        Spacer(1, 0.2 * inch),
    ]
    table_data = [['Metric', 'Value']] + [[k, str(v)] for k, v in pop.items() if k != 'mostCommonRiskFactors']
    for rf in pop.get('mostCommonRiskFactors', []):
        table_data.append([rf['factor'], str(rf['count'])])
    table = Table(table_data, colWidths=[3.5 * inch, 2 * inch])
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#dc2626')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
    ]))
    elements.append(table)
    doc.build(elements)
    output.seek(0)
    return output


def fetch_records_for_export(user_id, role, start_date=None, end_date=None, patient_id=None):
    date_filter = PredictionRecord.build_date_filter(start_date, end_date)
    extra = {}
    if date_filter:
        extra.update(date_filter)
    if role == 'patient':
        records, _ = PredictionRecord.find_by_user(user_id, page=1, per_page=10000, filters=extra)
        return records
    if role == 'doctor':
        patients, _ = User.find_patients_by_doctor(user_id, page=1, per_page=1000)
        patient_ids = [str(p['_id']) for p in patients]
        if patient_id:
            patient_ids = [pid for pid in patient_ids if pid == patient_id]
        records, _ = PredictionRecord.find_by_users(patient_ids, page=1, per_page=10000, filters=extra)
        patient_map = {str(p['_id']): p['name'] for p in patients}
        for r in records:
            r['patientName'] = patient_map.get(str(r['userId']), 'Unknown')
        return records
    records, _ = PredictionRecord.find_all(page=1, per_page=10000, filters=extra)
    return records
