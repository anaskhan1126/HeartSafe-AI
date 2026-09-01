from routes.auth import auth_bp
from routes.predictions import predictions_bp
from routes.analytics import analytics_bp
from routes.admin import admin_bp
from routes.doctor import doctor_bp
from routes.export import export_bp
from routes.reports import reports_bp
from routes.health import health_bp
from routes.consultations import consultations_bp
from routes.appointments import appointments_bp
from routes.medications import medications_bp
from routes.family_history import family_history_bp
from routes.notifications import notifications_bp
from routes.audit import audit_bp


def register_blueprints(app):
    app.register_blueprint(health_bp, url_prefix='/api')
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(predictions_bp, url_prefix='/api')
    app.register_blueprint(analytics_bp, url_prefix='/api/analytics')
    app.register_blueprint(admin_bp, url_prefix='/api/admin')
    app.register_blueprint(doctor_bp, url_prefix='/api/doctor')
    app.register_blueprint(export_bp, url_prefix='/api/export')
    app.register_blueprint(reports_bp, url_prefix='/api/reports')
    app.register_blueprint(consultations_bp, url_prefix='/api/consultations')
    app.register_blueprint(appointments_bp, url_prefix='/api/appointments')
    app.register_blueprint(medications_bp, url_prefix='/api/medications')
    app.register_blueprint(family_history_bp, url_prefix='/api/family-history')
    app.register_blueprint(notifications_bp, url_prefix='/api/notifications')
    app.register_blueprint(audit_bp, url_prefix='/api/audit')
