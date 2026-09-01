from enterprise_models import Notification


def notify(user_id, title, message, ntype='info', link=None):
    return Notification.create(user_id, title, message, ntype, link)


def notify_prediction_complete(user_id, prediction, probability, record_id):
    ntype = 'emergency' if prediction == 'High Risk' and probability >= 70 else 'success'
    title = 'Critical Risk Detected' if ntype == 'emergency' else 'Prediction Complete'
    msg = f'Your heart risk assessment: {prediction} ({probability}%)'
    return notify(user_id, title, msg, ntype, f'/reports')


def notify_new_report(user_id, record_id):
    return notify(user_id, 'New Report Available', 'Your medical prediction report is ready.', 'info', '/reports')


def notify_consultation_response(patient_id, doctor_name):
    return notify(
        patient_id,
        'Consultation Response',
        f'Dr. {doctor_name} responded to your consultation request.',
        'info',
        '/consultations',
    )


def notify_consultation_request(doctor_id, patient_name):
    return notify(
        doctor_id,
        'New Consultation Request',
        f'{patient_name} requested a consultation.',
        'info',
        '/consultations',
    )


def notify_appointment(user_id, doctor_type, date_str):
    label = 'Cardiologist' if doctor_type == 'cardiologist' else 'General Physician'
    return notify(
        user_id,
        'Appointment Scheduled',
        f'{label} appointment on {date_str}',
        'info',
        '/appointments',
    )
