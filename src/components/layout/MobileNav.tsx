'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const BOTTOM_NAV = [
  { href: '/daily',    icon: '📋', label: 'Log'     },
  { href: '/fasting',  icon: '⏱️', label: 'Fasting' },
  { href: '/progress', icon: '📈', label: 'Progress'},
  { href: '/streak',   icon: '🔥', label: 'Streak'  },
  { href: '/settings', icon: '⚙️', label: 'More'    },
]

export default function MobileNav() {
  const pathname = usePathname()
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 flex z-50">
      {BOTTOM_NAV.map(item => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            'flex-1 flex flex-col items-center py-3 text-xs gap-1 transition-colors',
            pathname === item.href ? 'text-green-400' : 'text-gray-500 hover:text-gray-300'
          )}
        >
          <span className="text-xl">{item.icon}</span>
          {item.label}
        </Link>
      ))}
    </nav>
  )
}
