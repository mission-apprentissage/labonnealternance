export class OneLinerLogger {
  constructor(
    public readonly options: { showRequestStart: boolean },
    public path: string[] = [],
    public level: string = "info"
  ) {}

  private log(level: string, args: any[]) {
    const [firstArg, secondArg] = args
    let printedArgs: any[] = args
    if (firstArg && typeof firstArg === "object") {
      if (firstArg.constructor === Error) {
        printedArgs = args
      } else if ("res" in firstArg && secondArg === "request completed") {
        const response = firstArg.res.raw
        const request = firstArg.res.request
        printedArgs = [`${response.statusCode} ${request.method} ${request.url}`]
      } else if ("req" in firstArg) {
        if (this.options.showRequestStart) {
          const request = firstArg.req
          printedArgs = [`starting ${request.method} ${request.url}`]
        } else {
          return
        }
      }
    }
    const leftArgs = [new Date().toISOString(), level.toUpperCase()]
    leftArgs.push(this.path.length ? "_." + this.path.join(".") : "global")
    console.info(leftArgs.map((str) => `[${str}]`).join(""), ...printedArgs)
  }
  info(...args) {
    this.log("info", args)
  }
  error(...args) {
    this.log("error", args)
  }
  debug(...args) {
    this.log("debug", args)
  }
  fatal(...args) {
    this.log("fatal", args)
  }
  warn(...args) {
    this.log("warn", args)
  }
  trace(...args) {
    this.log("trace", args)
  }
  silent() {}
  child(context: object) {
    const currentPath = Object.entries(context)
      .map(([key, value]) => `${key}=${value}`)
      .join(":")
    const newPaths = currentPath ? [...this.path, currentPath] : this.path
    return new OneLinerLogger(this.options, newPaths, this.level)
  }
}
