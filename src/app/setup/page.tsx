'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

export default function SetupPage() {
  const [form, setForm] = useState({
    password: '',
    confirmPassword: '',
    startingWeight: '',
    targetWeight: '',
    targetDate: '',
  })
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (form.password !== form.confirmPassword) {
      toast.error('Password tidak cocok')
      return
    }
    if (form.password.length < 6) {
      toast.error('Password minimal 6 karakter')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          password: form.password,
          startingWeight: parseFloat(form.startingWeight),
          targetWeight: parseFloat(form.targetWeight),
          targetDate: form.targetDate || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Setup gagal')
      } else {
        toast.success('Setup berhasil! Silakan login.')
        router.push('/login')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950">
      <div className="w-full max-w-md space-y-6 p-8 bg-gray-900 rounded-2xl border border-gray-800">
        <div className="text-center">
          <div className="text-4xl mb-3">🎯</div>
          <h1 className="text-2xl font-bold text-white">Setup Awal</h1>
          <p className="text-gray-400 text-sm mt-1">Buat password dan set target berat badanmu</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm text-gray-400 block mb-1">Password</label>
            <input
              type="password"
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              placeholder="Minimal 6 karakter"
              required
              className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-green-500"
            />
          </div>
          <div>
            <label className="text-sm text-gray-400 block mb-1">Konfirmasi Password</label>
            <input
              type="password"
              value={form.confirmPassword}
              onChange={e => setForm(f => ({ ...f, confirmPassword: e.target.value }))}
              placeholder="Ulangi password"
              required
              className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-green-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-gray-400 block mb-1">Berat Awal (kg)</label>
              <input
                type="number"
                step="0.1"
                value={form.startingWeight}
                onChange={e => setForm(f => ({ ...f, startingWeight: e.target.value }))}
                placeholder="e.g. 80"
                required
                className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-green-500"
              />
            </div>
            <div>
              <label className="text-sm text-gray-400 block mb-1">Berat Target (kg)</label>
              <input
                type="number"
                step="0.1"
                value={form.targetWeight}
                onChange={e => setForm(f => ({ ...f, targetWeight: e.target.value }))}
                placeholder="e.g. 65"
                required
                className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-green-500"
              />
            </div>
          </div>
          <div>
            <label className="text-sm text-gray-400 block mb-1">Tanggal Target (opsional)</label>
            <input
              type="date"
              value={form.targetDate}
              onChange={e => setForm(f => ({ ...f, targetDate: e.target.value }))}
              className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-green-500"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-semibold rounded-xl transition-colors"
          >
            {loading ? 'Menyimpan...' : 'Mulai Program'}
          </button>
        </form>
      </div>
    </div>
  )
}
