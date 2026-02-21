import { createRouter, createRoute, createRootRoute } from '@tanstack/react-router'
import { RootLayout } from './routes/__root'
import { HomePage } from './routes/index'
import { AddressPage } from './routes/addresses/AddressPage'

const rootRoute = createRootRoute({
    component: RootLayout,
})

const indexRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/',
    component: HomePage,
})

const addressRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/addresses/$address',
    component: AddressPage,
})

const routeTree = rootRoute.addChildren([indexRoute, addressRoute])

export const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
    interface Register {
        router: typeof router
    }
}