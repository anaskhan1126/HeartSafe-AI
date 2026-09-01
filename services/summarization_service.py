SUPPORTED_LANGUAGES = ('en', 'hi', 'ur', 'ar')

RISK_FACTOR_LABELS = {
    'high_cholesterol': {
        'en': 'high cholesterol',
        'hi': 'उच्च कोलेस्ट्रॉल',
        'ur': 'زیادہ کولیسٹرول',
        'ar': 'ارتفاع الكوليسترول',
    },
    'high_bp': {
        'en': 'high blood pressure',
        'hi': 'उच्च रक्तचाप',
        'ur': 'زیادہ بلڈ پریشر',
        'ar': 'ارتفاع ضغط الدم',
    },
    'exercise_angina': {
        'en': 'exercise-induced angina',
        'hi': 'व्यायाम से उत्पन्न एंजाइना',
        'ur': 'ورزش سے ہونے والی انجائنا',
        'ar': 'الذبحة الصدرية عند بذل المجهود',
    },
    'fasting_bs': {
        'en': 'elevated fasting blood sugar',
        'hi': 'उच्च उपवास रक्त शर्करा',
        'ur': 'زیادہ فاسٹنگ بلڈ شوگر',
        'ar': 'ارتفاع سكر الدم الصائم',
    },
    'advanced_age': {
        'en': 'advanced age',
        'hi': 'उन्नत आयु',
        'ur': 'زیادہ عمر',
        'ar': 'التقدم في العمر',
    },
    'abnormal_ecg': {
        'en': 'abnormal resting ECG',
        'hi': 'असामान्य आराम ईसीजी',
        'ur': 'غیر معمولی آرام دہ ای سی جی',
        'ar': 'تخطيط قلب غير طبيعي أثناء الراحة',
    },
    'st_slope': {
        'en': 'abnormal ST slope',
        'hi': 'असामान्य एसटी ढाल',
        'ur': 'غیر معمولی ایس ٹی ڈھلوان',
        'ar': 'انحدار ST غير طبيعي',
    },
}

TEMPLATES = {
    'high_risk': {
        'en': 'Your heart attack risk is elevated mainly because of {factors}. Regular exercise and consultation with a doctor are recommended.',
        'hi': 'आपके दिल के दौरे का जोखिम मुख्य रूप से {factors} के कारण बढ़ा हुआ है। नियमित व्यायाम और डॉक्टर से परामर्श की सिफारिश की जाती है।',
        'ur': 'دل کے دورے کا خطرہ بنیادی طور پر {factors} کی وجہ سے بڑھا ہوا ہے۔ باقاعدہ ورزش اور ڈاکٹر سے مشورہ کرنے کی سفارش کی جاتی ہے۔',
        'ar': 'خطر الإصابة بنوبة قلبية مرتفع بشكل رئيسي بسبب {factors}. يُنصح بممارسة الرياضة بانتظام واستشارة الطبيب.',
    },
    'low_risk': {
        'en': 'Your heart attack risk appears low based on the provided health indicators. Continue maintaining a healthy lifestyle and regular check-ups.',
        'hi': 'प्रदान किए गए स्वास्थ्य संकेतकों के आधार पर आपके दिल के दौरे का जोखिम कम प्रतीत होता है। स्वस्थ जीवनशैली और नियमित जांच जारी रखें।',
        'ur': 'فراہم کردہ صحت کے اشاروں کی بنیاد پر دل کے دورے کا خطرہ کم معلوم ہوتا ہے۔ صحت مند طرز زندگی اور باقاعدہ چیک اپ جاری رکھیں۔',
        'ar': 'يبدو أن خطر الإصابة بنوبة قلبية منخفض بناءً على المؤشرات الصحية المقدمة. استمر في الحفاظ على نمط حياة صحي والفحوصات الدورية.',
    },
    'moderate_risk': {
        'en': 'Your heart attack risk is moderate. Some factors like {factors} may need attention. Consider lifestyle changes and medical consultation.',
        'hi': 'आपके दिल के दौरे का जोखिम मध्यम है। {factors} जैसे कुछ कारकों पर ध्यान देने की आवश्यकता हो सकती है। जीवनशैली में बदलाव और चिकित्सा परामर्श पर विचार करें।',
        'ur': 'دل کے دورے کا خطرہ درمیانہ ہے۔ {factors} جیسے کچھ عوامل پر توجہ کی ضرورت ہو سکتی ہے۔ طرز زندگی میں تبدیلی اور طبی مشورے پر غور کریں۔',
        'ar': 'خطر الإصابة بنوبة قلبية معتدل. قد تحتاج بعض العوامل مثل {factors} إلى اهتمام. فكر في تغييرات نمط الحياة والاستشارة الطبية.',
    },
}

JOINERS = {
    'en': {'two': ' and ', 'many': ', '},
    'hi': {'two': ' और ', 'many': ', '},
    'ur': {'two': ' اور ', 'many': ', '},
    'ar': {'two': ' و ', 'many': '، '},
}


def _detect_risk_factors(inputs):
    factors = []
    if float(inputs.get('Cholesterol', 0)) > 240:
        factors.append('high_cholesterol')
    if float(inputs.get('RestingBP', 0)) > 140:
        factors.append('high_bp')
    if inputs.get('ExerciseAngina') == 'Yes':
        factors.append('exercise_angina')
    if inputs.get('FastingBS') == 'Yes':
        factors.append('fasting_bs')
    if float(inputs.get('Age', 0)) >= 55:
        factors.append('advanced_age')
    if inputs.get('RestingECG') in ('ST', 'LVH'):
        factors.append('abnormal_ecg')
    if inputs.get('ST_Slope') in ('Flat', 'Down'):
        factors.append('st_slope')
    return factors


def _join_factors(factor_keys, lang):
    labels = [RISK_FACTOR_LABELS[f][lang] for f in factor_keys]
    if not labels:
        return ''
    if len(labels) == 1:
        return labels[0]
    joiner = JOINERS[lang]['two'] if len(labels) == 2 else JOINERS[lang]['many']
    if len(labels) == 2:
        return labels[0] + joiner + labels[1]
    return joiner.join(labels[:-1]) + JOINERS[lang]['two'] + labels[-1]


def summarize_report(inputs, prediction, probability, language='en'):
    lang = language if language in SUPPORTED_LANGUAGES else 'en'
    factors = _detect_risk_factors(inputs)
    factor_text = _join_factors(factors, lang)

    if prediction == 'Low Risk':
        summary = TEMPLATES['low_risk'][lang]
    elif probability >= 70 or len(factors) >= 3:
        summary = TEMPLATES['high_risk'][lang].format(
            factors=factor_text or RISK_FACTOR_LABELS.get('advanced_age', {}).get(lang, 'multiple factors')
        )
    else:
        summary = TEMPLATES['moderate_risk'][lang].format(
            factors=factor_text or RISK_FACTOR_LABELS.get('advanced_age', {}).get(lang, 'some health indicators')
        )

    return {
        'summary': summary,
        'language': lang,
        'prediction': prediction,
        'probability': probability,
        'riskFactors': [RISK_FACTOR_LABELS[f][lang] for f in factors],
    }
