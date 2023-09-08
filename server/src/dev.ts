import { config } from "dotenv"

config({ path: ".env" })
config({ path: ".env.local", override: true })

// Dynamic import to start server after env are loaded
import("./main")
