import { createRouter } from '@tanstack/react-router'
import { rootRoute } from './routes/rootRoute'
import { indexRoute } from './features/investigation/routes/indexRoute'
import { addressRoute } from './features/investigation/routes/addressRoute'
import { bearCounterRoute } from './features/bear-counter/routes/bearCounterRoute'

const routeTree = rootRoute.addChildren([
    indexRoute,
    addressRoute,
    bearCounterRoute,
])

export const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
    interface Register {
        router: typeof router
    }
}
