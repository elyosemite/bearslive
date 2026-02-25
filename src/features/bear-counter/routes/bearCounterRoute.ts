import { createRoute } from '@tanstack/react-router'
import { rootRoute } from '../../../routes/rootRoute'
import { BearCounterPage } from '../pages/BearCounterPage'

export const bearCounterRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/demo',
    component: BearCounterPage,
})
