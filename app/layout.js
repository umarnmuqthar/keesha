import './globals.css'
import { Inter } from 'next/font/google'
import ClientLayout from './components/ClientLayout'
import { getUserProfile } from './actions'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
    title: 'Keesha - Finance Tracker',
    description: 'Manage your subscriptions smartly',
    icons: {
        icon: 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>💸</text></svg>',
    },
}

export default async function RootLayout({ children }) {
    // Fetch profile here to pass to ClientLayout -> Sidebar
    // Note: getUserProfile might need error handling or return null if failing
    const profile = await getUserProfile().catch(() => null);

    return (
        <html lang="en">
            <body className={inter.className}>
                <ClientLayout userProfile={profile}>
                    {children}
                </ClientLayout>
            </body>
        </html>
    )
}
