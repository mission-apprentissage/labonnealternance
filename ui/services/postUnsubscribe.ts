import { apiPost } from "../utils/api.utils"

export default async function postUnsubscribe({ email, reason, sirets }: { email: string; reason: string; sirets: string[] | null }) {
  try {
    const response = await apiPost("/unsubscribe", { body: { email, reason, sirets } })
    return response
  } catch (error) {
    console.error("postUnsubscribe error : ", error)
    return { result: "unexpected_error" }
  }
}
