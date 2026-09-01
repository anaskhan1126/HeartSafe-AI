from enterprise_models import FamilyHistory

# Risk adjustment weights (percentage points added to probability)
RISK_WEIGHTS = {
    'fatherHeartDisease': 6.0,
    'motherHeartDisease': 5.0,
    'motherDiabetes': 4.0,
    'fatherDiabetes': 3.5,
    'siblingHeartDisease': 5.5,
    'familyHypertension': 3.0,
    'familyStroke': 4.5,
}


def get_family_history(user_id):
    fh = FamilyHistory.get_or_create(user_id)
    return FamilyHistory.to_public(fh)


def apply_family_history_adjustment(user_id, probability, prediction):
    fh = FamilyHistory.get_or_create(user_id)
    adjustment = 0.0
    active_factors = []
    for field, weight in RISK_WEIGHTS.items():
        if fh.get(field):
            adjustment += weight
            active_factors.append(field)

    adjusted_prob = min(99.0, round(probability + adjustment, 2))
    adjusted_pred = 'High Risk' if adjusted_prob >= 50 else 'Low Risk'

    return adjusted_prob, adjusted_pred, {
        'adjustment': round(adjustment, 2),
        'activeFactors': active_factors,
        'originalProbability': probability,
        'originalPrediction': prediction,
    }


def get_emergency_guidance(probability, prediction):
    if prediction != 'High Risk' or probability < 70:
        return None
    return {
        'level': 'critical',
        'title': 'Critical Risk Detected',
        'message': 'Your heart attack risk is critically elevated. Seek immediate medical attention if you experience chest pain, shortness of breath, or dizziness.',
        'steps': [
            'Call emergency services (911) if experiencing severe symptoms',
            'Contact your cardiologist immediately',
            'Avoid strenuous activity until evaluated',
            'Take prescribed medications as directed',
            'Have someone stay with you if possible',
        ],
    }
