import ClientLayout from '@/features/legacy/components/ClientLayout'
import { getUserProfile } from '@/app/actions/profileActions'

export default async function LegacyLayout({ children }) {
  const profile = await getUserProfile().catch(() => null)

  return (
    <div>
      <ClientLayout userProfile={profile}>{children}</ClientLayout>
    </div>
  )
}
