'use client'

export default function GlobalError({ error, reset }) {
    return (
        <html>
            <body>
                <div style={{ padding: '2rem', fontFamily: 'system-ui' }}>
                    <h2>Something went wrong!</h2>
                    <p>{error.message}</p>
                    <button
                        onClick={() => reset()}
                        style={{ padding: '0.5rem 1rem', background: 'black', color: 'white', border: 'none', borderRadius: '4px' }}
                    >
                        Try again
                    </button>
                </div>
            </body>
        </html>
    )
}
