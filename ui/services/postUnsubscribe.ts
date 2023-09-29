import axios from "axios"

import { logError } from "../utils/tools"
import { publicConfig } from "config.public"

export default async function postUnsubscribe({ email, reason }) {
  let res = ""
  let isAxiosError = false

  try {
    const response = await axios.post(`${publicConfig.apiEndpoint}/unsubscribe`, { email, reason })
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
