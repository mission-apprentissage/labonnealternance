export const getHostFromHeader = (request: Request) => {
  const hostHeader = request.headers.get("host")
  const host = `${hostHeader.startsWith("localhost:") ? "http://" : "https://"}${hostHeader}`
  return host
}
