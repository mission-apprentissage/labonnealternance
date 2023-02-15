interface IApiCall {
  caller: string
  api_path: string
  response: string
  training_count: number
  job_count: number
  result_count: number
  created_at: Date
}

export { IApiCall }
