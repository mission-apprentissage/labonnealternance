export const getHostFromHeader = (request: Request): string => {
  const hostHeader = request.headers.get("host")
  const host = `${!hostHeader || hostHeader.startsWith("localhost:") ? "http://" : "https://"}${hostHeader}`
  return host
}
