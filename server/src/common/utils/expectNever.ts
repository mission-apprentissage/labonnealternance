export const expectNever = (never: never) => {
  throw new Error(`unexpected nevern got ${never}: it should have been catched at compile time`)
}
