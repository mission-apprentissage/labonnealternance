import { getDatabase } from "@/common/utils/mongodbUtils"

export const up = async () => {
  try {
    await getDatabase().collection("referentielopcos").drop()
    console.info("Collection 'referentielopcos' dropped successfully")
  } catch (error) {
    // Ignore error if collection doesn't exist
    if (error && typeof error === "object" && "code" in error && error.code === 26) {
      console.warn("Collection 'referentielopcos' does not exist, skipping drop")
    } else {
      throw error
    }
  }
}

// set to false ONLY IF migration does not imply a breaking change (ex: update field value or add index)
export const requireShutdown: boolean = false
