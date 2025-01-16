import { processScheduledRecruiterIntentions } from "@/services/application.service"

export const processRecruiterIntentions = async () => {
  await processScheduledRecruiterIntentions()
}
