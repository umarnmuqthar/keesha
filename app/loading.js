import LoadingSkeleton from './components/LoadingSkeleton';

export default function Loading() {
    return (
        <div style={{ flex: 1, height: '100vh', width: '100%' }}>
            {/* Simple skeleton loader to improve perceived performance */}
            <LoadingSkeleton />
        </div>
    );
}
