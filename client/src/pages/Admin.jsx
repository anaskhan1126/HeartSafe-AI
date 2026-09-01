import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { Users, Stethoscope, BarChart3, Trash2, UserPlus, Link, ScrollText } from 'lucide-react'
import GlassCard from '../components/ui/GlassCard'
import StatCard from '../components/ui/StatCard'
import { TableSkeleton } from '../components/ui/Skeleton'
import ExportButtons from '../components/ui/ExportButtons'
import {
  DailyChart, RiskPieChart, AgeHistogram,
} from '../components/charts/AnalyticsCharts'
import { getUsers, getDoctors, createUser, deleteUser, assignPatient } from '../services/adminService'
import { getAdminAnalytics, getPopulationAnalytics } from '../services/analyticsService'
import { exportPopulation } from '../services/exportService'
import { getFullAnalytics } from '../services/analyticsService'
import { getAuditLogs } from '../services/enterpriseService'

const Admin = () => {
  const { t } = useTranslation()
  const [tab, setTab] = useState('users')
  const [users, setUsers] = useState([])
  const [doctors, setDoctors] = useState([])
  const [adminStats, setAdminStats] = useState(null)
  const [population, setPopulation] = useState(null)
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'patient' })
  const [assignForm, setAssignForm] = useState({ patientId: '', doctorId: '' })
  const [auditLogs, setAuditLogs] = useState([])

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    try {
      setLoading(true)
      const [usersRes, doctorsRes, adminRes, popRes, analyticsRes] = await Promise.all([
        getUsers({ per_page: 50 }),
        getDoctors(),
        getAdminAnalytics(),
        getPopulationAnalytics(),
        getFullAnalytics(),
      ])
      setUsers(usersRes.users || [])
      setDoctors(doctorsRes.doctors || [])
      setAdminStats(adminRes)
      setPopulation(popRes)
      setAnalytics(analyticsRes)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    try {
      await createUser(newUser)
      setShowCreate(false)
      setNewUser({ name: '', email: '', password: '', role: 'patient' })
      fetchAll()
    } catch (err) {
      alert(err.response?.data?.error || 'Failed')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this user?')) return
    await deleteUser(id)
    fetchAll()
  }

  const handleAssign = async (e) => {
    e.preventDefault()
    await assignPatient(assignForm.patientId, assignForm.doctorId)
    setAssignForm({ patientId: '', doctorId: '' })
    fetchAll()
  }

  const tabs = [
    { id: 'users', label: t('admin.users'), icon: Users },
    { id: 'doctors', label: t('admin.doctors'), icon: Stethoscope },
    { id: 'analytics', label: t('admin.systemAnalytics'), icon: BarChart3 },
    { id: 'audit', label: t('enterprise.auditLogs'), icon: ScrollText },
  ]

  const loadAudit = async () => {
    const data = await getAuditLogs({ per_page: 50 })
    setAuditLogs(data.logs || [])
  }

  if (loading) return <TableSkeleton rows={8} />

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold gradient-text">{t('admin.title')}</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">{t('admin.subtitle')}</p>
      </motion.div>

      {adminStats && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard title="Patients" value={adminStats.userCounts?.patients} icon={Users} color="blue" />
          <StatCard title="Doctors" value={adminStats.userCounts?.doctors} icon={Stethoscope} color="green" />
          <StatCard title="Total Predictions" value={adminStats.stats?.totalPredictions} icon={BarChart3} color="purple" />
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => { setTab(id); if (id === 'audit') loadAudit() }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
              tab === id
                ? 'bg-primary-600 text-white shadow-lg'
                : 'bg-white/50 dark:bg-gray-800/50 text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800'
            }`}>
            <Icon className="w-4 h-4" />{label}
          </button>
        ))}
      </div>

      {tab === 'users' && (
        <GlassCard className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold">{t('admin.users')}</h2>
            <button onClick={() => setShowCreate(!showCreate)}
              className="btn-primary flex items-center gap-2 text-sm">
              <UserPlus className="w-4 h-4" />{t('admin.createUser')}
            </button>
          </div>

          {showCreate && (
            <form onSubmit={handleCreate} className="mb-6 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 grid grid-cols-1 md:grid-cols-2 gap-4">
              <input className="input-field" placeholder="Name" value={newUser.name}
                onChange={e => setNewUser({ ...newUser, name: e.target.value })} required />
              <input className="input-field" placeholder="Email" type="email" value={newUser.email}
                onChange={e => setNewUser({ ...newUser, email: e.target.value })} required />
              <input className="input-field" placeholder="Password" type="password" value={newUser.password}
                onChange={e => setNewUser({ ...newUser, password: e.target.value })} required />
              <select className="input-field" value={newUser.role}
                onChange={e => setNewUser({ ...newUser, role: e.target.value })}>
                <option value="patient">Patient</option>
                <option value="doctor">Doctor</option>
                <option value="admin">Admin</option>
              </select>
              <button type="submit" className="btn-primary md:col-span-2">{t('admin.createUser')}</button>
            </form>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-2">Name</th>
                  <th className="text-left py-3 px-2">Email</th>
                  <th className="text-left py-3 px-2">{t('admin.role')}</th>
                  <th className="text-left py-3 px-2">{t('admin.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} className="border-b border-gray-100 dark:border-gray-800">
                    <td className="py-3 px-2">{u.name}</td>
                    <td className="py-3 px-2">{u.email}</td>
                    <td className="py-3 px-2">
                      <span className="px-2 py-1 rounded-full text-xs bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400">
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 px-2">
                      <button onClick={() => handleDelete(u.id)} className="text-red-500 hover:text-red-700">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>
      )}

      {tab === 'doctors' && (
        <div className="space-y-6">
          <GlassCard className="p-6">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Link className="w-5 h-5" />{t('admin.assignPatient')}
            </h2>
            <form onSubmit={handleAssign} className="flex flex-wrap gap-4 items-end">
              <div>
                <label className="label">Patient</label>
                <select className="input-field" value={assignForm.patientId}
                  onChange={e => setAssignForm({ ...assignForm, patientId: e.target.value })} required>
                  <option value="">Select patient</option>
                  {users.filter(u => u.role === 'patient').map(u => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Doctor</label>
                <select className="input-field" value={assignForm.doctorId}
                  onChange={e => setAssignForm({ ...assignForm, doctorId: e.target.value })}>
                  <option value="">Unassign</option>
                  {doctors.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
              <button type="submit" className="btn-primary">Assign</button>
            </form>
          </GlassCard>

          <GlassCard className="p-6">
            <h2 className="text-lg font-bold mb-4">{t('admin.doctors')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {doctors.map(d => (
                <div key={d.id} className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                  <h3 className="font-semibold">{d.name}</h3>
                  <p className="text-sm text-gray-500">{d.email}</p>
                  <p className="text-sm text-primary-600 mt-2">{d.patientCount} {t('admin.patientCount')}</p>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      )}

      {tab === 'analytics' && population && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold">{t('analytics.population')}</h2>
            <ExportButtons onExport={exportPopulation} showDateFilter={false} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title="Avg Age" value={population.averageAge} color="blue" />
            <StatCard title="High Risk %" value={`${population.highRiskPercentage}%`} color="red" />
            <StatCard title="Low Risk %" value={`${population.lowRiskPercentage}%`} color="green" />
            <StatCard title="Avg Cholesterol" value={population.averageCholesterol} color="purple" />
            <StatCard title="Avg BP" value={population.averageBloodPressure} color="orange" />
            <StatCard title="Male %" value={`${population.maleRatio}%`} color="blue" />
            <StatCard title="Female %" value={`${population.femaleRatio}%`} color="green" />
          </div>

          {population.mostCommonRiskFactors?.length > 0 && (
            <GlassCard className="p-6">
              <h3 className="font-semibold mb-4">Most Common Risk Factors</h3>
              <div className="space-y-2">
                {population.mostCommonRiskFactors.map((rf, i) => (
                  <div key={i} className="flex justify-between items-center p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                    <span>{rf.factor}</span>
                    <span className="font-bold text-primary-600">{rf.count}</span>
                  </div>
                ))}
              </div>
            </GlassCard>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <DailyChart data={analytics?.daily} />
            <RiskPieChart data={analytics?.riskDistribution} />
            <AgeHistogram data={analytics?.ageDistribution} />
          </div>
        </div>
      )}

      {tab === 'audit' && (
        <GlassCard className="p-6">
          <h2 className="text-lg font-bold mb-4">{t('enterprise.auditLogs')}</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-2">Time</th>
                  <th className="text-left py-3 px-2">User</th>
                  <th className="text-left py-3 px-2">Action</th>
                  <th className="text-left py-3 px-2">Details</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map(log => (
                  <tr key={log.id} className="border-b border-gray-100 dark:border-gray-800">
                    <td className="py-3 px-2 text-xs">{new Date(log.timestamp).toLocaleString()}</td>
                    <td className="py-3 px-2">{log.userName || '—'}</td>
                    <td className="py-3 px-2">
                      <span className="px-2 py-1 rounded-full text-xs bg-gray-100 dark:bg-gray-800">{log.action}</span>
                    </td>
                    <td className="py-3 px-2 text-xs text-gray-500">{JSON.stringify(log.details).slice(0, 80)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {auditLogs.length === 0 && <p className="text-center py-8 text-gray-500">{t('common.noData')}</p>}
          </div>
        </GlassCard>
      )}
    </div>
  )
}

export default Admin
