import { createRoute } from '@tanstack/react-router'
import { rootRoute }   from '../../../routes/rootRoute'
import { GraphPage }   from '../pages/GraphPage'

export const graphRoute = createRoute({
    getParentRoute: () => rootRoute,
    path:           '/graph/$address',
    component:      GraphPage,
})
