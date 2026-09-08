from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

load_dotenv()

from config import Config
from extensions import jwt, init_db
from routes import register_blueprints
from services.prediction_service import make_prediction

app = Flask(__name__)
app.config.from_object(Config)
CORS(app, supports_credentials=True)

jwt.init_app(app)
init_db(app)
register_blueprints(app)


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/predict', methods=['POST'])
def predict():
    from services.prediction_service import ModelNotFoundError
    data = request.get_json() if request.is_json else request.form
    try:
        pred, probability, inputs = make_prediction(data)
    except ModelNotFoundError as e:
        return jsonify({'error': str(e)}), 503
    if request.is_json:
        return jsonify({'prediction': pred, 'probability': probability, 'inputs': inputs}), 200
    return render_template('result.html',
                           prediction=pred,
                           probability=probability)



@app.errorhandler(404)
def not_found(e):
    return jsonify({'error': 'Not found'}), 404


@app.errorhandler(500)
def server_error(e):
    return jsonify({'error': 'Internal server error'}), 500


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True, use_reloader=False)
