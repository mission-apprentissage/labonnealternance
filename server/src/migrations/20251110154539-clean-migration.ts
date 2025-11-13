import { getDatabase } from "@/common/utils/mongodbUtils"

export const up = async () => {
  const db = getDatabase()
  await db.collection("changelog").deleteMany({})
}

export const requireShutdown: boolean = false
