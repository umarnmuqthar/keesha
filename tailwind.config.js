/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: "var(--primary)",
                success: "var(--success)",
                danger: "var(--danger)",
                background: "var(--background)",
                surface: "var(--surface)",
                sidebar: "var(--sidebar-bg)",
                "text-primary": "var(--text-primary)",
                "text-secondary": "var(--text-secondary)",
                border: "var(--border)",
            },
            borderRadius: {
                DEFAULT: "var(--radius)",
                sm: "var(--radius-sm)",
                lg: "var(--radius-lg)",
            },
            fontSize: {
                xs: ['0.75rem', { lineHeight: '1rem', letterSpacing: '0.01em' }],
                sm: ['0.875rem', { lineHeight: '1.25rem', letterSpacing: '0em' }],
                base: ['0.9375rem', { lineHeight: '1.4rem', letterSpacing: '-0.011em' }], // 15px
                lg: ['1.0625rem', { lineHeight: '1.5rem', letterSpacing: '-0.016em' }], // 17px
                xl: ['1.25rem', { lineHeight: '1.75rem', letterSpacing: '-0.021em' }], // 20px
                '2xl': ['1.5rem', { lineHeight: '2rem', letterSpacing: '-0.022em' }], // 24px
                '3xl': ['1.75rem', { lineHeight: '2.25rem', letterSpacing: '-0.022em' }], // 28px
                '4xl': ['2.125rem', { lineHeight: '2.5rem', letterSpacing: '-0.022em' }], // 34px
            }
        },
    },
    plugins: [],
}
