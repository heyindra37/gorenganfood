'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

const NAV_ITEMS = [
  { href: '/daily',       icon: '📋', label: 'Daily Log'    },
  { href: '/fasting',     icon: '⏱️', label: 'Fasting'      },
  { href: '/weight',      icon: '⚖️', label: 'Berat Badan'  },
  { href: '/progress',    icon: '📈', label: 'Progress'     },
  { href: '/consistency', icon: '💯', label: 'Konsistensi'  },
  { href: '/streak',      icon: '🔥', label: 'Streak'       },
  { href: '/badges',      icon: '🏅', label: 'Badges'       },
  { href: '/heatmap',     icon: '🗓️', label: 'Heatmap'      },
  { href: '/history',     icon: '📖', label: 'Riwayat'      },
  { href: '/settings',    icon: '⚙️', label: 'Settings'     },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  return (
    <aside className="hidden md:flex flex-col w-56 bg-gray-900 border-r border-gray-800 min-h-screen py-6 px-3">
      <div className="flex items-center gap-2 px-3 mb-8">
        <span className="text-2xl">🥗</span>
        <span className="font-bold text-white text-lg">Diet Tracker</span>
      </div>
      <nav className="flex-1 space-y-1">
        {NAV_ITEMS.map(item => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
              pathname === item.href || pathname.startsWith(item.href + '/')
                ? 'bg-green-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            )}
          >
            <span className="text-base">{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>
      <button
        onClick={handleLogout}
        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-500 hover:text-white hover:bg-gray-800 transition-colors mt-4"
      >
        <span>🚪</span> Logout
      </button>
    </aside>
  )
}
