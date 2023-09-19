export default (role = {}) => {
  return async (req, res, next) => {
    const { user } = req
    console.log("====================================>>")
    console.log(JSON.stringify(user, null, 2))
    if (user && user.role === role) {
      next()
    } else {
      return res.status(401).send("Not authorized")
    }
  }
}
