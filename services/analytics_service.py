from datetime import datetime, timedelta
from bson import ObjectId
import extensions


def _base_match(user_ids=None, start_date=None, end_date=None):
    match = {}
    if user_ids:
        valid_ids = [ObjectId(uid) for uid in user_ids if uid and ObjectId.is_valid(str(uid))]
        if valid_ids:
            match['userId'] = {'$in': valid_ids}
    if start_date or end_date:
        ts = {}
        if start_date and isinstance(start_date, str) and start_date.strip():
            try:
                ts['$gte'] = datetime.fromisoformat(start_date.strip().replace('Z', ''))
            except (ValueError, TypeError):
                pass
        if end_date and isinstance(end_date, str) and end_date.strip():
            try:
                end = datetime.fromisoformat(end_date.strip().replace('Z', ''))
                ts['$lte'] = end.replace(hour=23, minute=59, second=59)
            except (ValueError, TypeError):
                pass
        if ts:
            match['timestamp'] = ts
    return match



def get_dashboard_stats(user_ids=None, start_date=None, end_date=None):
    match = _base_match(user_ids, start_date, end_date)
    pipeline = [
        {'$match': match} if match else {'$match': {}},
        {'$group': {
            '_id': None,
            'total': {'$sum': 1},
            'highRisk': {'$sum': {'$cond': [{'$eq': ['$prediction', 'High Risk']}, 1, 0]}},
            'lowRisk': {'$sum': {'$cond': [{'$eq': ['$prediction', 'Low Risk']}, 1, 0]}},
            'avgAge': {'$avg': '$inputs.Age'},
            'avgCholesterol': {'$avg': '$inputs.Cholesterol'},
            'avgBP': {'$avg': '$inputs.RestingBP'},
        }},
    ]
    result = list(extensions.db.records.aggregate(pipeline))
    stats = result[0] if result else {}

    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    month_start = today_start.replace(day=1)

    today_match = {**match, 'timestamp': {'$gte': today_start}}
    month_match = {**match, 'timestamp': {'$gte': month_start}}

    return {
        'totalPredictions': stats.get('total', 0),
        'highRiskPredictions': stats.get('highRisk', 0),
        'lowRiskPredictions': stats.get('lowRisk', 0),
        'averagePatientAge': round(stats.get('avgAge', 0) or 0, 1),
        'averageCholesterol': round(stats.get('avgCholesterol', 0) or 0, 1),
        'averageBloodPressure': round(stats.get('avgBP', 0) or 0, 1),
        'todayPredictions': extensions.db.records.count_documents(today_match),
        'monthPredictions': extensions.db.records.count_documents(month_match),
    }


def get_daily_predictions(user_ids=None, days=30):
    start = datetime.utcnow() - timedelta(days=days)
    match = _base_match(user_ids)
    match['timestamp'] = {'$gte': start}
    pipeline = [
        {'$match': match},
        {'$group': {
            '_id': {'$dateToString': {'format': '%Y-%m-%d', 'date': '$timestamp'}},
            'count': {'$sum': 1},
            'highRisk': {'$sum': {'$cond': [{'$eq': ['$prediction', 'High Risk']}, 1, 0]}},
            'lowRisk': {'$sum': {'$cond': [{'$eq': ['$prediction', 'Low Risk']}, 1, 0]}},
        }},
        {'$sort': {'_id': 1}},
    ]
    return [{'date': r['_id'], 'count': r['count'], 'highRisk': r['highRisk'], 'lowRisk': r['lowRisk']}
            for r in extensions.db.records.aggregate(pipeline)]


def get_weekly_predictions(user_ids=None, weeks=12):
    start = datetime.utcnow() - timedelta(weeks=weeks)
    match = _base_match(user_ids)
    match['timestamp'] = {'$gte': start}
    pipeline = [
        {'$match': match},
        {'$group': {
            '_id': {'$isoWeek': '$timestamp'},
            'year': {'$first': {'$isoWeekYear': '$timestamp'}},
            'count': {'$sum': 1},
            'highRisk': {'$sum': {'$cond': [{'$eq': ['$prediction', 'High Risk']}, 1, 0]}},
            'lowRisk': {'$sum': {'$cond': [{'$eq': ['$prediction', 'Low Risk']}, 1, 0]}},
        }},
        {'$sort': {'year': 1, '_id': 1}},
    ]
    return [{'week': f"W{r['_id']}", 'year': r['year'], 'count': r['count'],
             'highRisk': r['highRisk'], 'lowRisk': r['lowRisk']}
            for r in extensions.db.records.aggregate(pipeline)]


def get_monthly_predictions(user_ids=None, months=12):
    start = datetime.utcnow() - timedelta(days=months * 30)
    match = _base_match(user_ids)
    match['timestamp'] = {'$gte': start}
    pipeline = [
        {'$match': match},
        {'$group': {
            '_id': {'$dateToString': {'format': '%Y-%m', 'date': '$timestamp'}},
            'count': {'$sum': 1},
            'highRisk': {'$sum': {'$cond': [{'$eq': ['$prediction', 'High Risk']}, 1, 0]}},
            'lowRisk': {'$sum': {'$cond': [{'$eq': ['$prediction', 'Low Risk']}, 1, 0]}},
        }},
        {'$sort': {'_id': 1}},
    ]
    return [{'month': r['_id'], 'count': r['count'], 'highRisk': r['highRisk'], 'lowRisk': r['lowRisk']}
            for r in extensions.db.records.aggregate(pipeline)]


def get_risk_distribution(user_ids=None):
    match = _base_match(user_ids)
    pipeline = [
        {'$match': match} if match else {'$match': {}},
        {'$group': {'_id': '$prediction', 'count': {'$sum': 1}}},
    ]
    return [{'name': r['_id'], 'value': r['count']} for r in extensions.db.records.aggregate(pipeline)]


def get_age_distribution(user_ids=None):
    match = _base_match(user_ids)
    bins = [(0, 30), (30, 40), (40, 50), (50, 60), (60, 70), (70, 120)]
    pipeline = [
        {'$match': match} if match else {'$match': {}},
        {'$bucket': {
            'groupBy': '$inputs.Age',
            'boundaries': [b[0] for b in bins] + [120],
            'default': 'Other',
            'output': {'count': {'$sum': 1}},
        }},
    ]
    results = list(extensions.db.records.aggregate(pipeline))
    labels = ['0-29', '30-39', '40-49', '50-59', '60-69', '70+']
    data = []
    for i, r in enumerate(results):
        label = labels[i] if i < len(labels) else str(r['_id'])
        data.append({'range': label, 'count': r['count']})
    if not data:
        pipeline2 = [
            {'$match': match} if match else {'$match': {}},
            {'$group': {
                '_id': {'$switch': {
                    'branches': [
                        {'case': {'$lt': ['$inputs.Age', 30]}, 'then': '0-29'},
                        {'case': {'$lt': ['$inputs.Age', 40]}, 'then': '30-39'},
                        {'case': {'$lt': ['$inputs.Age', 50]}, 'then': '40-49'},
                        {'case': {'$lt': ['$inputs.Age', 60]}, 'then': '50-59'},
                        {'case': {'$lt': ['$inputs.Age', 70]}, 'then': '60-69'},
                    ],
                    'default': '70+',
                }},
                'count': {'$sum': 1},
            }},
            {'$sort': {'_id': 1}},
        ]
        data = [{'range': r['_id'], 'count': r['count']} for r in extensions.db.records.aggregate(pipeline2)]
    return data


def get_gender_distribution(user_ids=None):
    match = _base_match(user_ids)
    pipeline = [
        {'$match': match} if match else {'$match': {}},
        {'$group': {'_id': '$inputs.Sex', 'count': {'$sum': 1}}},
    ]
    return [{'gender': 'Male' if r['_id'] == 'M' else 'Female', 'count': r['count']}
            for r in extensions.db.records.aggregate(pipeline)]


def get_risk_trend(user_ids=None, days=30):
    return get_daily_predictions(user_ids, days)


def get_prediction_heatmap(user_ids=None):
    match = _base_match(user_ids)
    pipeline = [
        {'$match': match} if match else {'$match': {}},
        {'$group': {
            '_id': {
                'day': {'$dayOfWeek': '$timestamp'},
                'hour': {'$hour': '$timestamp'},
            },
            'count': {'$sum': 1},
        }},
    ]
    day_names = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    heatmap = []
    for r in extensions.db.records.aggregate(pipeline):
        day_idx = r['_id']['day'] - 1
        heatmap.append({
            'day': day_names[day_idx] if 0 <= day_idx < 7 else str(r['_id']['day']),
            'hour': r['_id']['hour'],
            'count': r['count'],
        })
    return heatmap


def get_population_analytics():
    pipeline = [
        {'$group': {
            '_id': None,
            'total': {'$sum': 1},
            'avgAge': {'$avg': '$inputs.Age'},
            'avgCholesterol': {'$avg': '$inputs.Cholesterol'},
            'avgBP': {'$avg': '$inputs.RestingBP'},
            'male': {'$sum': {'$cond': [{'$eq': ['$inputs.Sex', 'M']}, 1, 0]}},
            'female': {'$sum': {'$cond': [{'$eq': ['$inputs.Sex', 'F']}, 1, 0]}},
            'highRisk': {'$sum': {'$cond': [{'$eq': ['$prediction', 'High Risk']}, 1, 0]}},
            'lowRisk': {'$sum': {'$cond': [{'$eq': ['$prediction', 'Low Risk']}, 1, 0]}},
            'highCholesterol': {'$sum': {'$cond': [{'$gt': ['$inputs.Cholesterol', 240]}, 1, 0]}},
            'highBP': {'$sum': {'$cond': [{'$gt': ['$inputs.RestingBP', 140]}, 1, 0]}},
            'exerciseAngina': {'$sum': {'$cond': [{'$eq': ['$inputs.ExerciseAngina', 'Yes']}, 1, 0]}},
            'fastingBS': {'$sum': {'$cond': [{'$eq': ['$inputs.FastingBS', 'Yes']}, 1, 0]}},
        }},
    ]
    result = list(extensions.db.records.aggregate(pipeline))
    if not result:
        return {
            'averageAge': 0, 'maleRatio': 0, 'femaleRatio': 0,
            'highRiskPercentage': 0, 'lowRiskPercentage': 0,
            'averageCholesterol': 0, 'averageBloodPressure': 0,
            'mostCommonRiskFactors': [], 'totalRecords': 0,
        }
    r = result[0]
    total = r['total'] or 1
    risk_factors = [
        {'factor': 'High Cholesterol (>240)', 'count': r.get('highCholesterol', 0)},
        {'factor': 'High Blood Pressure (>140)', 'count': r.get('highBP', 0)},
        {'factor': 'Exercise Angina', 'count': r.get('exerciseAngina', 0)},
        {'factor': 'Fasting Blood Sugar > 120', 'count': r.get('fastingBS', 0)},
    ]
    risk_factors.sort(key=lambda x: x['count'], reverse=True)
    return {
        'averageAge': round(r.get('avgAge', 0) or 0, 1),
        'maleRatio': round((r.get('male', 0) / total) * 100, 1),
        'femaleRatio': round((r.get('female', 0) / total) * 100, 1),
        'highRiskPercentage': round((r.get('highRisk', 0) / total) * 100, 1),
        'lowRiskPercentage': round((r.get('lowRisk', 0) / total) * 100, 1),
        'averageCholesterol': round(r.get('avgCholesterol', 0) or 0, 1),
        'averageBloodPressure': round(r.get('avgBP', 0) or 0, 1),
        'mostCommonRiskFactors': risk_factors[:4],
        'totalRecords': total,
    }


def get_full_analytics(user_ids=None):
    return {
        'stats': get_dashboard_stats(user_ids),
        'daily': get_daily_predictions(user_ids),
        'weekly': get_weekly_predictions(user_ids),
        'monthly': get_monthly_predictions(user_ids),
        'riskDistribution': get_risk_distribution(user_ids),
        'ageDistribution': get_age_distribution(user_ids),
        'genderDistribution': get_gender_distribution(user_ids),
        'riskTrend': get_risk_trend(user_ids),
        'heatmap': get_prediction_heatmap(user_ids),
    }
