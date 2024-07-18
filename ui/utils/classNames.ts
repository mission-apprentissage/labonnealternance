export const classNames = (classRecord: Record<string, boolean>) =>
  Object.entries(classRecord)
    .flatMap(([className, shouldAdd]) => (shouldAdd ? [className] : []))
    .join(" ")
