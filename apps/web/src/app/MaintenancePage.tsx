import type { MaintenanceConfig } from '@/shared/lib/maintenance'

// Self-contained maintenance page
// Uses inline styles intentionally — must work without Tailwind, router, or stores

export function MaintenancePage({ config }: { config: MaintenanceConfig }) {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#1a1a2e',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        color: '#e0e0ff',
        padding: '24px',
      }}
    >
      <div style={{ textAlign: 'center', maxWidth: '480px' }}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 512 512"
          style={{ width: '80px', height: '80px', margin: '0 auto 32px' }}
        >
          <rect width="512" height="512" rx="96" fill="#1a1a2e" stroke="#e0e0ff" strokeWidth="24" />
          <text
            x="256"
            y="340"
            fontFamily="system-ui, sans-serif"
            fontSize="280"
            fontWeight="700"
            fill="#e0e0ff"
            textAnchor="middle"
          >
            K
          </text>
        </svg>

        <h1
          style={{
            fontSize: '24px',
            fontWeight: 600,
            marginBottom: '16px',
            lineHeight: 1.3,
          }}
        >
          Технические работы
        </h1>

        <p
          style={{
            fontSize: '16px',
            lineHeight: 1.6,
            color: '#a0a0c0',
            marginBottom: '24px',
          }}
        >
          {config.message}
        </p>

        {config.estimatedReturn && (
          <p
            style={{
              fontSize: '14px',
              color: '#7070a0',
            }}
          >
            Ожидаемое время возврата: {config.estimatedReturn}
          </p>
        )}
      </div>
    </div>
  )
}
