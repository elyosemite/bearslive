import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { addressSchema } from "../schemas/address.schema"
import { useNavigate } from "@tanstack/react-router"
import { useInvestigation } from "../stores/useInvestigationStore"
import type { AddressFormData } from "../schemas/address.schema"

export function HomePage() {
    const navigate = useNavigate()
    const setActiveAddress = useInvestigation((state) => state.setActiveAddress)

    const {
        register,
        handleSubmit,
        formState: { errors }
    } = useForm<AddressFormData>({
        resolver: zodResolver(addressSchema)
    })

    const onSubmit = (data: AddressFormData) => {
        setActiveAddress(data.address)
        navigate({ to: '/addresses/$address', params: { address: data.address } })
    }

    return (
        <div>
            <h2>Investigate a Bitcoin Address</h2>
            <form onSubmit={handleSubmit(onSubmit)}>
                <input
                    {...register("address")}
                    placeholder="e.g. 1A1zP1eP5QGefi2DMPTfTL5SLmv7Divf"
                />
                {errors.address && <p>{errors.address.message}</p>}
                <button type="submit">Investigate</button>
            </form>
        </div>
    )
}