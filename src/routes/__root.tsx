import { Outlet } from '@tanstack/react-router'
import { useEffect } from 'react'
import { useThemeStore } from '../store/useThemeStore'
import { ThemeToggle } from '../components/ThemeToggle/ThemeToggle'

export function RootLayout() {
    const theme = useThemeStore((s) => s.theme)

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme)
    }, [theme])

    return (
        <>
            <ThemeToggle />
            <Outlet />
        </>
    )
}
