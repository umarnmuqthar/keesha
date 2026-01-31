import { getUserProfile } from '../actions';
import ProfileClient from './ProfileClient';
import { redirect } from 'next/navigation';

export const metadata = {
    title: 'My Profile - Keesha',
    description: 'Manage your Keesha account profile',
};

export default async function ProfilePage() {
    const profile = await getUserProfile();

    if (!profile) {
        redirect('/login');
    }

    return <ProfileClient initialProfile={profile} />;
}
