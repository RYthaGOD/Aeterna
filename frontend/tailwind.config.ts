import type { Config } from "tailwindcss";

export default {
    content: [
        "./pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                background: "var(--background)",
                foreground: "var(--foreground)",
                purple: {
                    400: '#c084fc',
                    500: '#a855f7',
                    900: '#581c87',
                },
                zinc: {
                    800: '#27272a',
                    900: '#18181b',
                    950: '#09090b',
                },
                'aeterna-emerald': '#10B981',
                'aeterna-gold': '#FFD700',
            },
            fontFamily: {
                sans: ['var(--font-geist-sans)', 'sans-serif'],
                mono: ['var(--font-geist-mono)', 'monospace'],
            },
        },
    },
    plugins: [],
} satisfies Config;
