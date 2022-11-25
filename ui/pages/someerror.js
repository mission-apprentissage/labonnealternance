import axios from "axios"
import React from "react"
import baseUrl from "utils/baseUrl"

export default function SomeError() {
  const response = axios.get(`${baseUrl}/api/error500`)
  console.log("response", response)
  return <div className="c-some-error">Some error...</div>
}
