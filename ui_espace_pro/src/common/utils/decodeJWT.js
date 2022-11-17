const jwt = require("jsonwebtoken")

export default (token) => {
  return {
    token,
    ...jwt.decode(token),
  }
}
