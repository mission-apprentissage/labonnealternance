export default (role = {}) => {
  return async (req, res, next) => {
    const { user } = req
    if (user && user.role === role) {
      next()
    } else {
      return res.status(401).send("Not authorized")
    }
  }
}
