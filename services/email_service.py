import os
import smtplib
from email.mime.application import MIMEApplication
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText


def _smtp_configured():
    return bool(os.environ.get('SMTP_HOST') and os.environ.get('SMTP_USER'))


def send_email(to_email, subject, body, attachment=None, attachment_name='report.pdf'):
    if not _smtp_configured():
        print(f'[Email skipped - SMTP not configured] To: {to_email}, Subject: {subject}')
        return False

    host = os.environ.get('SMTP_HOST')
    port = int(os.environ.get('SMTP_PORT', '587'))
    user = os.environ.get('SMTP_USER')
    password = os.environ.get('SMTP_PASSWORD', '')
    from_email = os.environ.get('SMTP_FROM', user)

    msg = MIMEMultipart()
    msg['From'] = from_email
    msg['To'] = to_email
    msg['Subject'] = subject
    msg.attach(MIMEText(body, 'html'))

    if attachment:
        part = MIMEApplication(attachment.read(), Name=attachment_name)
        part['Content-Disposition'] = f'attachment; filename="{attachment_name}"'
        msg.attach(part)
        attachment.seek(0)

    try:
        with smtplib.SMTP(host, port) as server:
            server.starttls()
            if password:
                server.login(user, password)
            server.sendmail(from_email, to_email, msg.as_string())
        return True
    except Exception as e:
        print(f'[Email error] {e}')
        return False


def send_prediction_report(user, record, pdf_buffer):
    subject = f'HeartAI Report - {record["prediction"]}'
    body = f"""
    <html><body>
    <h2>Heart Attack Risk Report</h2>
    <p>Hello {user.get('name', 'Patient')},</p>
    <p>Your recent assessment result:</p>
    <ul>
      <li><strong>Prediction:</strong> {record['prediction']}</li>
      <li><strong>Probability:</strong> {record['probability']}%</li>
    </ul>
    <p>Please find your detailed PDF report attached.</p>
    <p><em>This is not a substitute for professional medical advice.</em></p>
    </body></html>
    """
    return send_email(
        user['email'],
        subject,
        body,
        attachment=pdf_buffer,
        attachment_name=f'heart_report_{record["_id"]}.pdf',
    )
