export const assertTrue = (condition: boolean, errorMessage: string) => {
  if (!condition) {
    throw new Error(errorMessage)
  }
}
