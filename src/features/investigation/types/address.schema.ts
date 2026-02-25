import { z } from 'zod'

export const addressSchema = z.object({
    address: z
        .string()
        .min(1, 'Address is required')
        .regex(
            /^(1|3)[a-zA-Z0-9]{25,33}$|^bc1[a-zA-Z0-9]{6,87}$/,
            'Address can only contain letters, numbers, spaces, commas, apostrophes, and hyphens'
        ),
})

export type AddressFormData = z.infer<typeof addressSchema>
