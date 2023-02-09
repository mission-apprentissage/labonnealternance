import rateLimit from "express-rate-limit"

export const limiter3PerSecond = rateLimit({
  windowMs: 1000, // 1 second
  max: 3, // limit each IP to 3 requests per windowMs
})

export const limiter1Per20Second = rateLimit({
  windowMs: 20000, // 20 seconds
  max: 1, // limit each IP to 1 request per windowMs
})

export const limiter5PerSecond = rateLimit({
  windowMs: 1000, // 1 second
  max: 5, // limit each IP to 5 requests per windowMs
})
export const limiter7PerSecond = rateLimit({
  windowMs: 1000, // 1 second
  max: 7, // limit each IP to 7 requests per windowMs
})
export const limiter10PerSecond = rateLimit({
  windowMs: 1000, // 1 second
  max: 10, // limit each IP to 10 requests per windowMs
})

export const limiter20PerSecond = rateLimit({
  windowMs: 1000, // 1 second
  max: 20, // limit each IP to 20 requests per windowMs
})
