const Switch = {
  parts: ["container", "track", "thumb"],
  baseStyle: {
    container: {},
    track: {
      padding: "0",
      bg: "white",
      border: "1px solid #000091",
      _checked: {
        bg: "bluefrance.500",
      },
      _focus: {
        boxShadow: "0 0 0 3px #E5E5F4",
      },
    },
    thumb: {
      border: "1px solid #000091",
    },
  },
}

export { Switch }
