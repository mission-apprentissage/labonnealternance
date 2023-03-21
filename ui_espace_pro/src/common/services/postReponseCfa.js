import axios from "axios"
import { baseUrl } from "../config/config"

async function stall(stallTime = 3000) {
  await new Promise((resolve) => setTimeout(resolve, stallTime))
}

export default async function postReponseCfa(reponse_cfa_h, _baseUrl = baseUrl, _axios = axios, _window = window, _logError = logError) {
  let res = ""
  await stall(1000)
  res = "ok"
  return res
}
