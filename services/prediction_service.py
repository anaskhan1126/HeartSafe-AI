import os
import numpy as np
import torch
import joblib
from nn_model import HeartNN

_scaler = None
_model = None

sex_map = {'M': 1, 'F': 0}
cp_map = {'ATA': 0, 'NAP': 1, 'ASY': 2, 'TA': 3}
ecg_map = {'Normal': 0, 'ST': 1, 'LVH': 2}
angina_map = {'No': 0, 'Yes': 1}
slope_map = {'Up': 0, 'Flat': 1, 'Down': 2}

REQUIRED_FIELDS = [
    'Age', 'Sex', 'ChestPainType', 'RestingBP', 'Cholesterol',
    'FastingBS', 'RestingECG', 'MaxHR', 'ExerciseAngina', 'Oldpeak', 'ST_Slope',
]

VALID_OPTIONS = {
    'Sex': set(sex_map.keys()),
    'ChestPainType': set(cp_map.keys()),
    'FastingBS': {'Yes', 'No'},
    'RestingECG': set(ecg_map.keys()),
    'ExerciseAngina': set(angina_map.keys()),
    'ST_Slope': set(slope_map.keys()),
}


class ModelNotFoundError(Exception):
    pass


def _ensure_models_loaded():
    global _scaler, _model
    if _model is None:
        scaler_path = 'models/scaler.pkl'
        model_path = 'models/nn_model.pth'
        if not os.path.exists(scaler_path) or not os.path.exists(model_path):
            raise ModelNotFoundError(
                'ML model files not found. Run "python train_nn.py" to train and save models.'
            )
        _scaler = joblib.load(scaler_path)
        _model = HeartNN(input_dim=11)
        _model.load_state_dict(torch.load(model_path, map_location='cpu'))
        _model.eval()


def validate_prediction_input(data):
    errors = []
    for field in REQUIRED_FIELDS:
        if field not in data or data[field] == '' or data[field] is None:
            errors.append(f'{field} is required')
    for field, options in VALID_OPTIONS.items():
        if field in data and data[field] not in options:
            errors.append(f'Invalid value for {field}')
    numeric_fields = {
        'Age': (1, 120),
        'RestingBP': (0, 300),
        'Cholesterol': (0, 600),
        'MaxHR': (0, 220),
        'Oldpeak': (-5, 10),
    }
    for field, (lo, hi) in numeric_fields.items():
        if field in data and data[field] != '':
            try:
                val = float(data[field])
                if val < lo or val > hi:
                    errors.append(f'{field} must be between {lo} and {hi}')
            except (TypeError, ValueError):
                errors.append(f'{field} must be a number')
    return errors


def make_prediction(form_data):
    _ensure_models_loaded()

    Age = float(form_data['Age'])
    Sex = sex_map[form_data['Sex']]
    ChestPainType = cp_map[form_data['ChestPainType']]
    RestingBP = float(form_data['RestingBP'])
    Cholesterol = float(form_data['Cholesterol'])
    FastingBS = 1 if form_data['FastingBS'] == 'Yes' else 0
    RestingECG = ecg_map[form_data['RestingECG']]
    MaxHR = float(form_data['MaxHR'])
    ExerciseAngina = angina_map[form_data['ExerciseAngina']]
    Oldpeak = float(form_data['Oldpeak'])
    ST_Slope = slope_map[form_data['ST_Slope']]

    data = np.array([[
        Age, Sex, ChestPainType, RestingBP, Cholesterol, FastingBS,
        RestingECG, MaxHR, ExerciseAngina, Oldpeak, ST_Slope,
    ]])

    scaled = _scaler.transform(data)

    with torch.no_grad():
        logit = _model(torch.tensor(scaled, dtype=torch.float32)).item()
        prob = 1 / (1 + np.exp(-logit))

    pred = 'High Risk' if prob >= 0.5 else 'Low Risk'
    probability = round(prob * 100, 2)

    return pred, probability, {
        'Age': Age, 'Sex': form_data['Sex'], 'ChestPainType': form_data['ChestPainType'],
        'RestingBP': RestingBP, 'Cholesterol': Cholesterol, 'FastingBS': form_data['FastingBS'],
        'RestingECG': form_data['RestingECG'], 'MaxHR': MaxHR,
        'ExerciseAngina': form_data['ExerciseAngina'],
        'Oldpeak': Oldpeak, 'ST_Slope': form_data['ST_Slope'],
    }
