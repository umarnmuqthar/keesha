import LoadingSkeleton from '@/app/components/LoadingSkeleton';

export default function Loading() {
    return (
        <div style={{ flex: 1, height: '100vh', width: '100%' }}>
            <LoadingSkeleton />
        </div>
    );
}
