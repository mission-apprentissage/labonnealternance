import axios from "axios"
import { baseUrl } from "../config/config"
import { logError } from "../utils/tools"

export default async function postUnsubscribe({ email, reason }) {
  let res = ""
  let isAxiosError = false

  try {
    const response = await axios.post(baseUrl + "/api/unsubscribe", { email, reason })
    res = response?.data?.error || response.data
  } catch (error) {
    console.log("postUnsubscribe error : ", error)
    logError(error)
    isAxiosError = true
  }

  if (isAxiosError) {
    res = "unexpected_error"
  }

  return res
}
