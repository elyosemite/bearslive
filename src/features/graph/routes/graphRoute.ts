import { createRoute } from '@tanstack/react-router'
import { rootRoute }   from '../../../routes/rootRoute'
import { GraphPage }   from '../pages/GraphPage'
import { z }           from 'zod'

const searchSchema = z.object({
    from: z.string().optional(),  // ISO date YYYY-MM-DD
    to:   z.string().optional(),  // ISO date YYYY-MM-DD
})

export const graphRoute = createRoute({
    getParentRoute: () => rootRoute,
    path:           '/graph/$address',
    component:      GraphPage,
    validateSearch: searchSchema,
})
