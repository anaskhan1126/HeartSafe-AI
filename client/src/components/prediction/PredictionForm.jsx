import React from 'react'
import { useTranslation } from 'react-i18next'
import VoiceInput from '../voice/VoiceInput'

const PredictionForm = ({ formData, onChange, onSubmit, loading, error }) => {
  const { t } = useTranslation()

  const handleChange = (e) => {
    onChange({ ...formData, [e.target.name]: e.target.value })
  }

  const handleVoiceUpdate = (updater) => {
    if (typeof updater === 'function') {
      onChange(updater(formData))
    } else {
      onChange({ ...formData, ...updater })
    }
  }

  return (
    <div>
      <VoiceInput onFieldsUpdate={handleVoiceUpdate} />

      {error && (
        <div className="mt-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-4 mt-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">{t('form.age')}</label>
            <input type="number" name="Age" value={formData.Age} onChange={handleChange}
              className="input-field" required min="1" max="120" />
          </div>
          <div>
            <label className="label">{t('form.sex')}</label>
            <select name="Sex" value={formData.Sex} onChange={handleChange} className="input-field">
              <option value="M">{t('common.male')}</option>
              <option value="F">{t('common.female')}</option>
            </select>
          </div>
        </div>

        <div>
          <label className="label">{t('form.chestPain')}</label>
          <select name="ChestPainType" value={formData.ChestPainType} onChange={handleChange} className="input-field">
            <option value="ATA">ATA</option>
            <option value="NAP">NAP</option>
            <option value="ASY">ASY</option>
            <option value="TA">TA</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">{t('form.restingBP')}</label>
            <input type="number" name="RestingBP" value={formData.RestingBP} onChange={handleChange}
              className="input-field" required min="0" />
          </div>
          <div>
            <label className="label">{t('form.cholesterol')}</label>
            <input type="number" name="Cholesterol" value={formData.Cholesterol} onChange={handleChange}
              className="input-field" required min="0" />
          </div>
        </div>

        <div>
          <label className="label">{t('form.fastingBS')}</label>
          <select name="FastingBS" value={formData.FastingBS} onChange={handleChange} className="input-field">
            <option value="No">No</option>
            <option value="Yes">Yes</option>
          </select>
        </div>

        <div>
          <label className="label">{t('form.restingECG')}</label>
          <select name="RestingECG" value={formData.RestingECG} onChange={handleChange} className="input-field">
            <option value="Normal">Normal</option>
            <option value="ST">ST</option>
            <option value="LVH">LVH</option>
          </select>
        </div>

        <div>
          <label className="label">{t('form.maxHR')}</label>
          <input type="number" name="MaxHR" value={formData.MaxHR} onChange={handleChange}
            className="input-field" required min="0" max="220" />
        </div>

        <div>
          <label className="label">{t('form.exerciseAngina')}</label>
          <select name="ExerciseAngina" value={formData.ExerciseAngina} onChange={handleChange} className="input-field">
            <option value="No">No</option>
            <option value="Yes">Yes</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">{t('form.oldpeak')}</label>
            <input type="number" step="0.1" name="Oldpeak" value={formData.Oldpeak} onChange={handleChange}
              className="input-field" required />
          </div>
          <div>
            <label className="label">{t('form.stSlope')}</label>
            <select name="ST_Slope" value={formData.ST_Slope} onChange={handleChange} className="input-field">
              <option value="Up">Up</option>
              <option value="Flat">Flat</option>
              <option value="Down">Down</option>
            </select>
          </div>
        </div>

        <button type="submit" disabled={loading} className="btn-primary w-full mt-6">
          {loading ? t('dashboard.predicting') : t('dashboard.predictBtn')}
        </button>
      </form>
    </div>
  )
}

export default PredictionForm
