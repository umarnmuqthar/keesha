import './globals.css'
import '../styles/tokens/tokens.css'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { AppStateProviders } from '@/components/layout/AppStateProviders'

export const metadata = {
  title: 'Keesha - Finance Tracker',
  description: 'Manage your subscriptions smartly',
  icons: {
    icon: '/icon.png',
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <AppStateProviders>{children}</AppStateProviders>
        <SpeedInsights />
      </body>
    </html>
  )
}
