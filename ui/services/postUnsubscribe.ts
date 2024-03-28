import axios from "axios"

import { publicConfig } from "@/config.public"

import { logError } from "../utils/tools"

export default async function postUnsubscribe({ email, reason, sirets }: { email: string; reason: string; sirets: string[] | null }): Promise<{
  result: string
  companies?: { enseigne: string; siret: string; address: string }[]
}> {
  let res = { result: "" }
  let isAxiosError = false

  try {
    const response = await axios.post(`${publicConfig.apiEndpoint}/unsubscribe`, { email, reason, sirets })

    res = response?.data?.error || response.data
  } catch (error) {
    console.error("postUnsubscribe error : ", error)
    logError(error)
    isAxiosError = true
  }

  if (isAxiosError) {
    res = { result: "unexpected_error" }
  }

  return res
}
