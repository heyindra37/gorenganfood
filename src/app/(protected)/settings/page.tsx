'use client'
import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import type { UserSettings, UserGoals } from '@/types'

export default function SettingsPage() {
  const [settings, setSettings] = useState<UserSettings | null>(null)
  const [goals, setGoals] = useState<UserGoals | null>(null)
  const [saving, setSaving] = useState(false)

  // Password change state
  const [oldPw, setOldPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')

  const fetchData = useCallback(async () => {
    const res = await fetch('/api/settings')
    const json = await res.json()
    setSettings(json.settings)
    setGoals(json.goals)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  async function saveSettings(e: React.FormEvent) {
    e.preventDefault()
    if (!settings) return
    setSaving(true)
    try {
      const { hashed_password, updated_at, id, ...settingsUpdate } = settings
      void hashed_password; void updated_at; void id
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...settingsUpdate, goals }),
      })
      if (res.ok) toast.success('✅ Settings disimpan!')
      else {
        const j = await res.json()
        toast.error(j.error)
      }
    } finally {
      setSaving(false)
    }
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault()
    if (newPw !== confirmPw) { toast.error('Password baru tidak cocok'); return }
    if (newPw.length < 6) { toast.error('Password minimal 6 karakter'); return }
    setSaving(true)
    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ old_password: oldPw, new_password: newPw }),
      })
      if (res.ok) {
        toast.success('✅ Password berhasil diubah!')
        setOldPw(''); setNewPw(''); setConfirmPw('')
      } else {
        const j = await res.json()
        toast.error(j.error)
      }
    } finally {
      setSaving(false)
    }
  }

  if (!settings) return <div className="p-6 text-gray-400">Memuat...</div>

  function numInput(field: keyof UserSettings, label: string) {
    return (
      <div key={field}>
        <label className="text-xs text-gray-400 block mb-1">{label}</label>
        <input
          type="number"
          value={(settings as UserSettings)[field] as number}
          onChange={e => setSettings(s => s ? { ...s, [field]: parseInt(e.target.value) || 0 } : s)}
          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-green-500"
        />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-6 space-y-6">
      <h1 className="text-2xl font-bold text-white">Settings</h1>

      <form onSubmit={saveSettings} className="space-y-6">
        {/* Point weights */}
        <section className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
          <h2 className="font-semibold text-white mb-4">💪 Poin Kebiasaan Baik</h2>
          <div className="grid grid-cols-2 gap-3">
            {numInput('pt_walk_10', 'Jalan 10 menit')}
            {numInput('pt_walk_30', 'Jalan 30 menit')}
            {numInput('pt_walk_45', 'Jalan 45–60 menit')}
            {numInput('pt_weights_under30', 'Beban <30 menit')}
            {numInput('pt_weights_30_60', 'Beban 30–60 menit')}
            {numInput('pt_other_exercise', 'Olahraga lain')}
            {numInput('pt_weigh_in', 'Timbang BB')}
          </div>
        </section>

        <section className="bg-gray-900 border border-red-900/30 rounded-2xl p-4">
          <h2 className="font-semibold text-white mb-4">🚫 Poin Pelanggaran</h2>
          <div className="grid grid-cols-2 gap-3">
            {numInput('pt_flour_wheat', 'Tepung/gandum')}
            {numInput('pt_colored_drink', 'Minuman berwarna')}
            {numInput('pt_mie_goreng', 'Mie goreng')}
            {numInput('pt_mie_rebus', 'Mie rebus')}
            {numInput('pt_nasi_goreng', 'Nasi goreng')}
          </div>
        </section>

        <section className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
          <h2 className="font-semibold text-white mb-4">🎫 Kredit & Jatah Darurat</h2>
          <div className="grid grid-cols-2 gap-3">
            {numInput('kredit_limit', 'Kredit mingguan (4.2)')}
            {numInput('darurat_limit', 'Jatah darurat mingguan (4.1)')}
          </div>
        </section>

        {goals && (
          <section className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
            <h2 className="font-semibold text-white mb-4">🎯 Target Berat Badan</h2>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-400 block mb-1">Berat Awal (kg)</label>
                <input type="number" step="0.1" value={goals.starting_weight_kg}
                  onChange={e => setGoals(g => g ? { ...g, starting_weight_kg: parseFloat(e.target.value) } : g)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-green-500" />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Berat Target (kg)</label>
                <input type="number" step="0.1" value={goals.target_weight_kg}
                  onChange={e => setGoals(g => g ? { ...g, target_weight_kg: parseFloat(e.target.value) } : g)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-green-500" />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Tanggal Mulai</label>
                <input type="date" value={goals.start_date}
                  onChange={e => setGoals(g => g ? { ...g, start_date: e.target.value } : g)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-green-500" />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Tanggal Target</label>
                <input type="date" value={goals.target_date || ''}
                  onChange={e => setGoals(g => g ? { ...g, target_date: e.target.value } : g)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-green-500" />
              </div>
            </div>
          </section>
        )}

        <button
          type="submit"
          disabled={saving}
          className="w-full py-3 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-semibold rounded-xl transition-colors"
        >
          {saving ? 'Menyimpan...' : 'Simpan Semua Settings'}
        </button>
      </form>

      {/* Password change */}
      <form onSubmit={changePassword} className="bg-gray-900 border border-gray-800 rounded-2xl p-4 space-y-3">
        <h2 className="font-semibold text-white mb-2">🔐 Ganti Password</h2>
        <div>
          <label className="text-xs text-gray-400 block mb-1">Password Lama</label>
          <input type="password" value={oldPw} onChange={e => setOldPw(e.target.value)} required
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-green-500" />
        </div>
        <div>
          <label className="text-xs text-gray-400 block mb-1">Password Baru</label>
          <input type="password" value={newPw} onChange={e => setNewPw(e.target.value)} required minLength={6}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-green-500" />
        </div>
        <div>
          <label className="text-xs text-gray-400 block mb-1">Konfirmasi Password Baru</label>
          <input type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} required
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-green-500" />
        </div>
        <button type="submit" disabled={saving}
          className="w-full py-2.5 bg-blue-700 hover:bg-blue-600 disabled:opacity-50 text-white font-medium rounded-xl transition-colors">
          Ganti Password
        </button>
      </form>
    </div>
  )
}
