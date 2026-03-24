export default function Loading() {
    return (
        <div style={{ 
            flex: 1, 
            height: '100vh', 
            width: '100%', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            color: 'var(--ds-color-ink-subtle)',
            fontSize: 'var(--ds-font-size-2)'
        }}>
            Loading...
        </div>
    );
}
