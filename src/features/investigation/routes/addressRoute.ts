import { createRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { rootRoute } from '../../../routes/rootRoute'
import { AddressPage } from '../pages/AddressPage'

export const addressRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/addresses/$address',
    component: AddressPage,
    validateSearch: z.object({
        page:      z.number().int().min(1).default(1),
        direction: z.enum(['all', 'in', 'out']).default('all'),
        status:    z.enum(['all', 'confirmed', 'unconfirmed']).default('all'),
    }),
})
