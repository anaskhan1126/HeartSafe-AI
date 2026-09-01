import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Pill, Plus, Trash2 } from 'lucide-react'
import GlassCard from '../components/ui/GlassCard'
import { getMedications, addMedication, deleteMedication } from '../services/enterpriseService'

const Medications = () => {
  const { t } = useTranslation()
  const [meds, setMeds] = useState([])
  const [form, setForm] = useState({ name: '', dosage: '', schedule: '', notes: '' })
  const [showForm, setShowForm] = useState(false)

  useEffect(() => { load() }, [])

  const load = async () => {
    const data = await getMedications()
    setMeds(data)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    await addMedication(form)
    setForm({ name: '', dosage: '', schedule: '', notes: '' })
    setShowForm(false)
    load()
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold gradient-text">{t('enterprise.medications')}</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">{t('enterprise.medicationsDesc')}</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> {t('enterprise.addMedication')}
        </button>
      </div>

      {showForm && (
        <GlassCard className="p-6">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input className="input-field" placeholder={t('enterprise.medicineName')} value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })} required />
            <input className="input-field" placeholder={t('enterprise.dosage')} value={form.dosage}
              onChange={e => setForm({ ...form, dosage: e.target.value })} required />
            <input className="input-field md:col-span-2" placeholder={t('enterprise.medSchedule')} value={form.schedule}
              onChange={e => setForm({ ...form, schedule: e.target.value })} required />
            <textarea className="input-field md:col-span-2" placeholder={t('enterprise.notes')} value={form.notes}
              onChange={e => setForm({ ...form, notes: e.target.value })} />
            <button type="submit" className="btn-primary">{t('common.save')}</button>
          </form>
        </GlassCard>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {meds.length === 0 ? (
          <GlassCard className="p-8 text-center text-gray-500 col-span-2">{t('enterprise.noMedications')}</GlassCard>
        ) : meds.map(m => (
          <GlassCard key={m.id} className="p-5">
            <div className="flex justify-between">
              <div className="flex items-start gap-3">
                <Pill className="w-6 h-6 text-primary-600 mt-1" />
                <div>
                  <h3 className="font-bold">{m.name}</h3>
                  <p className="text-sm text-gray-600">{m.dosage}</p>
                  <p className="text-sm text-primary-600 mt-1">{m.schedule}</p>
                  {m.notes && <p className="text-xs text-gray-400 mt-1">{m.notes}</p>}
                </div>
              </div>
              <button onClick={() => deleteMedication(m.id).then(load)} className="text-red-500 hover:text-red-700">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  )
}

export default Medications
