import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Calendar, Stethoscope } from 'lucide-react'
import GlassCard from '../components/ui/GlassCard'
import { getAppointments, createAppointment, cancelAppointment } from '../services/enterpriseService'

const Appointments = () => {
  const { t } = useTranslation()
  const [items, setItems] = useState([])
  const [form, setForm] = useState({ doctorType: 'cardiologist', appointmentDate: '', notes: '' })

  useEffect(() => { load() }, [])

  const load = async () => {
    const data = await getAppointments()
    setItems(data.appointments || [])
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    await createAppointment(form)
    setForm({ doctorType: 'cardiologist', appointmentDate: '', notes: '' })
    load()
  }

  const handleCancel = async (id) => {
    if (window.confirm('Cancel this appointment?')) {
      await cancelAppointment(id)
      load()
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold gradient-text">{t('enterprise.appointments')}</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">{t('enterprise.appointmentsDesc')}</p>
      </div>

      <GlassCard className="p-6">
        <h2 className="font-bold mb-4 flex items-center gap-2"><Calendar className="w-5 h-5" /> {t('enterprise.bookAppointment')}</h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">{t('enterprise.doctorType')}</label>
            <select className="input-field" value={form.doctorType}
              onChange={e => setForm({ ...form, doctorType: e.target.value })}>
              <option value="cardiologist">{t('enterprise.cardiologist')}</option>
              <option value="general_physician">{t('enterprise.generalPhysician')}</option>
            </select>
          </div>
          <div>
            <label className="label">{t('enterprise.dateTime')}</label>
            <input type="datetime-local" className="input-field" value={form.appointmentDate}
              onChange={e => setForm({ ...form, appointmentDate: e.target.value })} required />
          </div>
          <div className="md:col-span-2">
            <label className="label">{t('enterprise.notes')}</label>
            <textarea className="input-field" value={form.notes}
              onChange={e => setForm({ ...form, notes: e.target.value })} />
          </div>
          <button type="submit" className="btn-primary md:col-span-2">{t('enterprise.schedule')}</button>
        </form>
      </GlassCard>

      <div className="space-y-3">
        {items.map(a => (
          <GlassCard key={a.id} className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Stethoscope className="w-5 h-5 text-primary-600" />
              <div>
                <p className="font-semibold">{a.doctorTypeLabel}</p>
                <p className="text-sm text-gray-500">{new Date(a.appointmentDate).toLocaleString()}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-xs px-2 py-1 rounded-full ${a.status === 'scheduled' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>{a.status}</span>
              {a.status === 'scheduled' && (
                <button onClick={() => handleCancel(a.id)} className="text-xs text-red-600 hover:underline">Cancel</button>
              )}
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  )
}

export default Appointments
