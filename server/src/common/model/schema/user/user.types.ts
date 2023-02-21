interface IUser {
  username: string
  password: string
  firstname: string
  lastname: string
  phone: string
  email: string
  role: string
  last_action_date: Date
  is_anonymized: boolean
}

export { IUser }
