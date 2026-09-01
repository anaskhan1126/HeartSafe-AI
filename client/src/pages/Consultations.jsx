import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import { MessageSquare, Send } from 'lucide-react'
import GlassCard from '../components/ui/GlassCard'
import { getConsultations, createConsultation, respondConsultation } from '../services/enterpriseService'

const Consultations = () => {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ subject: '', message: '' })
  const [response, setResponse] = useState({})
  const role = user?.role || 'patient'

  useEffect(() => { load() }, [])

  const load = async () => {
    setLoading(true)
    try {
      const data = await getConsultations()
      setItems(data.consultations || [])
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    await createConsultation(form)
    setForm({ subject: '', message: '' })
    load()
  }

  const handleRespond = async (id) => {
    if (!response[id]?.trim()) return
    await respondConsultation(id, response[id])
    setResponse({ ...response, [id]: '' })
    load()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold gradient-text">{t('enterprise.consultations')}</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">{t('enterprise.consultationsDesc')}</p>
      </div>

      {role === 'patient' && (
        <GlassCard className="p-6">
          <h2 className="font-bold mb-4 flex items-center gap-2"><Send className="w-5 h-5" /> {t('enterprise.requestConsultation')}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input className="input-field" placeholder={t('enterprise.subject')} value={form.subject}
              onChange={e => setForm({ ...form, subject: e.target.value })} required />
            <textarea className="input-field min-h-[100px]" placeholder={t('enterprise.message')} value={form.message}
              onChange={e => setForm({ ...form, message: e.target.value })} required />
            <button type="submit" className="btn-primary">{t('enterprise.submitRequest')}</button>
          </form>
        </GlassCard>
      )}

      <div className="space-y-4">
        {loading ? <p>{t('common.loading')}</p> : items.length === 0 ? (
          <GlassCard className="p-8 text-center text-gray-500">{t('enterprise.noConsultations')}</GlassCard>
        ) : items.map(c => (
          <GlassCard key={c.id} className="p-5">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-semibold">{c.subject}</h3>
              <span className={`text-xs px-2 py-1 rounded-full ${c.status === 'responded' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                {c.status}
              </span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">{c.message}</p>
            {c.patientName && <p className="text-xs text-gray-400 mt-1">Patient: {c.patientName}</p>}
            {c.response && (
              <div className="mt-3 p-3 rounded-lg bg-indigo-50 dark:bg-indigo-900/20">
                <p className="text-sm font-medium text-indigo-700 dark:text-indigo-400">Doctor Response:</p>
                <p className="text-sm mt-1">{c.response}</p>
              </div>
            )}
            {role === 'doctor' && c.status === 'pending' && (
              <div className="mt-3 flex gap-2">
                <input className="input-field flex-1" placeholder="Your response..."
                  value={response[c.id] || ''} onChange={e => setResponse({ ...response, [c.id]: e.target.value })} />
                <button onClick={() => handleRespond(c.id)} className="btn-primary">{t('enterprise.respond')}</button>
              </div>
            )}
          </GlassCard>
        ))}
      </div>
    </div>
  )
}

export default Consultations
