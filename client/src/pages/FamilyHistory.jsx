import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Users, Save } from 'lucide-react'
import GlassCard from '../components/ui/GlassCard'
import { getFamilyHistory, updateFamilyHistory } from '../services/enterpriseService'

const FIELDS = [
  { key: 'fatherHeartDisease', label: 'Father: Heart Disease' },
  { key: 'motherHeartDisease', label: 'Mother: Heart Disease' },
  { key: 'motherDiabetes', label: 'Mother: Diabetes' },
  { key: 'fatherDiabetes', label: 'Father: Diabetes' },
  { key: 'siblingHeartDisease', label: 'Sibling: Heart Disease' },
  { key: 'familyHypertension', label: 'Family: Hypertension' },
  { key: 'familyStroke', label: 'Family: Stroke' },
]

const FamilyHistory = () => {
  const { t } = useTranslation()
  const [data, setData] = useState({})
  const [saved, setSaved] = useState(false)

  useEffect(() => { load() }, [])

  const load = async () => {
    const fh = await getFamilyHistory()
    setData(fh)
  }

  const toggle = (key) => setData({ ...data, [key]: !data[key] })

  const handleSave = async () => {
    await updateFamilyHistory(data)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold gradient-text">{t('enterprise.familyHistory')}</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">{t('enterprise.familyHistoryDesc')}</p>
      </div>

      <GlassCard className="p-6">
        <h2 className="font-bold mb-4 flex items-center gap-2"><Users className="w-5 h-5" /> {t('enterprise.familyConditions')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {FIELDS.map(({ key, label }) => (
            <label key={key} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800">
              <input type="checkbox" checked={!!data[key]} onChange={() => toggle(key)}
                className="w-5 h-5 rounded text-primary-600" />
              <span className="text-sm font-medium">{label}</span>
            </label>
          ))}
        </div>
        <button onClick={handleSave} className="btn-primary mt-6 flex items-center gap-2">
          <Save className="w-4 h-4" /> {saved ? t('common.success') : t('common.save')}
        </button>
        <p className="text-xs text-gray-500 mt-3">{t('enterprise.familyHistoryNote')}</p>
      </GlassCard>
    </div>
  )
}

export default FamilyHistory
