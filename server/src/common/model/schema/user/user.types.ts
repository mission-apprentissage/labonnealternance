import { ObjectId } from "mongodb"

export interface IUser {
  _id: ObjectId
  username: string
  password: string
  firstname: string
  lastname: string
  phone: string
  email: string
  role: string
  type: string
  last_action_date: Date
  is_anonymized: boolean
}
