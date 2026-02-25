import { createRoute } from '@tanstack/react-router'
import { rootRoute } from '../../../routes/rootRoute'
import { HomePage } from '../pages/HomePage'

export const indexRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/',
    component: HomePage,
})
