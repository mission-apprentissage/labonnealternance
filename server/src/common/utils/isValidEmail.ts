import { z } from "zod"

export const isValidEmail = (email: string | null | undefined) => z.string().email().safeParse(email).success
