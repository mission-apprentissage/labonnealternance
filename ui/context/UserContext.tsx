import { useContext } from "react"

import { UserContext } from "@/app/(espace-pro)/espace-pro/contexts/userContext"

export const useAuth = () => useContext(UserContext)
