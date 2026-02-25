import { createRoute } from '@tanstack/react-router'
import { rootRoute } from '../../../routes/rootRoute'
import { AddressPage } from '../pages/AddressPage'

export const addressRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/addresses/$address',
    component: AddressPage,
})
