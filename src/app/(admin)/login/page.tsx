'use client'

import { signIn } from 'next-auth/react'
import Image from 'next/image'

export default function AdminLoginPage() {
  return (
    <div style={{ background: '#0e0a0b', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 28, textAlign: 'center' }}>
        <Image src="/logo-white.svg" alt="PHL·ART" width={48} height={48} />
        <div>
          <p className="font-display font-bold text-white lowercase m-0" style={{ fontSize: 24, letterSpacing: '-0.01em' }}>
            Студия публикаций
          </p>
          <p className="font-body font-light m-0 mt-2" style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)' }}>
            Войдите, чтобы продолжить
          </p>
        </div>
        <button
          onClick={() => signIn('github', { callbackUrl: '/admin/dashboard' })}
          className="font-nav font-bold uppercase"
          style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#ff3b30', color: '#fff', border: 'none', padding: '13px 24px', fontSize: 12, letterSpacing: '0.06em', cursor: 'pointer' }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
          </svg>
          Войти через GitHub
        </button>
      </div>
    </div>
  )
}
