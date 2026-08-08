import { z } from "zod"

export const isValidEmail = (email: string | null | undefined) => z.email().safeParse(email).success
