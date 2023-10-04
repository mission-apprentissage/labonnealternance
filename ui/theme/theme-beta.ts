const rootFontSizePx = 16

const colors = {
  white: "#ffffff",
  beige: "#f9f8f6",
  redmarianne: "#e1000f",
  success: "#0d6635",
  error: "#b60000",
  warning: "#fa5c00",
  info: "#3a55d1",
  bluefrance: {
    100: "#F2F2F9",
    113: "#3131FF",
    200: "#E5E5F4",
    500: "#000091",
  },
  grey: {
    800: "#1e1e1e",
    750: "#2a2a2a",
    700: "#383838",
    650: "#4a4a4a",
    600: "#6a6a6a",
    500: "#9c9c9c",
    425: "#666666",
    400: "#cecece",
    300: "#e7e7e7",
    200: "#f0f0f0",
    150: "#fafafc",
    100: "#f8f8f8",
  },
  greenwarm: {
    600: "#877e59",
    500: "#958b62",
    400: "#cac5b1",
    300: "#e5e2d8",
    200: "#f4f3ef",
  },
  greenlight: {
    600: "#88a34a",
    500: "#91ae4f",
    400: "#c8d7a7",
    300: "#e3ebd3",
    200: "#f4f7ed",
  },
  greenmedium: {
    600: "#19905b",
    500: "#169b62",
    400: "#8bcdb1",
    300: "#c5e6d8",
    200: "#e8f5ef",
  },
  greendark: {
    600: "#40605b",
    500: "#466964",
    400: "#a3b4b2",
    300: "#d1dad8",
    200: "#edf0f0",
  },
  greensoft: {
    600: "#22967e",
    500: "#00ac8c",
    400: "#80d6c6",
    300: "#bfeae2",
    200: "#e5f7f4",
  },
  bluesoft: {
    600: "#5266a1",
    500: "#5770be",
    400: "#abb8de",
    300: "#d5dbef",
    200: "#eef1f8",
  },
  bluedark: {
    600: "#444871",
    500: "#484d7a",
    400: "#a4a6bc",
    300: "#d5dbef",
    200: "#eef1f8",
  },
  pinksoft: {
    600: "#d07c75",
    500: "#ff8d7e",
    400: "#ffc6bf",
    300: "#ffe2df",
    200: "#fff4f2",
  },
  pinkdark: {
    600: "#c0806f",
    500: "#d08a77",
    400: "#e7c4bb",
    300: "#f3e2dd",
    200: "#faf3f1",
  },
  pinklight: {
    600: "#ddb094",
    500: "#ffc29e",
    400: "#ffe0cf",
    300: "#fff0e7",
    200: "#fff9f5",
  },
  yellowmedium: {
    600: "#ead737",
    500: "#ffe800",
    400: "#fff480",
    300: "#fff9bf",
    200: "#fffde5",
  },
  yellowdark: {
    600: "#e3bd41",
    500: "#fdcf41",
    400: "#fff480",
    300: "#fff9bf",
    200: "#fffde5",
  },
  orangemedium: {
    600: "#d38742",
    500: "#ff9940",
    400: "#ffcc9f",
    300: "#ffe5cf",
    200: "#fff5ec",
  },
  orangedark: {
    600: "#d0805b",
    500: "#e18b63",
    400: "#f0c5b1",
    300: "#f8e2d8",
    200: "#fcf3ef",
  },
  orangesoft: {
    600: "#cb634b",
    500: "#ff6f4c",
    400: "#ffb7a5",
    300: "#ffdbd2",
    200: "#fff1ed",
  },
  purple: {
    600: "#714753",
    500: "#7d4e5b",
    400: "#bea6ad",
    300: "#ded3d6",
    200: "#f2edef",
  },
  brown: {
    600: "#956052",
    500: "#a26959",
    400: "#d0b4ac",
    300: "#e8dad6",
    200: "#f6f0ee",
  },
  bluegrey: {
    200: "#eef1f8",
    100: "#f9fafc",
  },
}

const fontSizes = {
  giga: "4.75rem",
  mega: "3.375rem",
  alpha: "2.25rem",
  beta: "1.75rem",
  gamma: "1.25rem",
  delta: "1.125rem",
  epsilon: "1rem",
  zeta: "0.875rem",
  omega: "0.75rem",
  caption: "0.6875rem",
  legal: "0.625rem",
}

const textStyles = {
  h2: {
    fontSize: ["1.75rem", "2rem"],
    lineHeight: ["2.25rem", "2.5rem"],
    fontWeight: "700",
  },
  h4: {
    fontSize: ["1.375rem", "1.5rem"],
    lineHeight: ["1.75rem", "2rem"],
  },
  h6: {
    fontSize: ["1.125rem", "1.25rem"],
    lineHeight: ["1.5rem", "1.75rem"],
  },
  "rf-text": {
    fontSize: ["1rem"],
    lineHeight: "1.5rem",
    fontWeight: "400",
  },
  sm: {
    fontSize: ["0.875rem"],
    lineHeight: "1.5rem",
    fontWeight: "400",
  },
  xs: {
    fontSize: ["0.75rem"],
    lineHeight: "1.35rem",
    fontWeight: "400",
  },
}

const fonts = {
  body: "Marianne, Arial",
  heading: "Marianne, Arial",
}

const styles = {
  global: {
    "html, body": {
      fontSize: `${rootFontSizePx}px`,
      fontFamily: "Marianne, Arial",
      background: "white",
      color: "bluefrance",
    },
  },
}

const space = {
  0: "0",
  "1v": `${4 / rootFontSizePx}rem`,
  "1w": `${8 / rootFontSizePx}rem`,
  "3v": `${12 / rootFontSizePx}rem`,
  "2w": `${16 / rootFontSizePx}rem`,
  "3w": `${24 / rootFontSizePx}rem`,
  "4w": `${32 / rootFontSizePx}rem`,
  "5w": `${40 / rootFontSizePx}rem`,
  "6w": `${48 / rootFontSizePx}rem`,
  "7w": `${56 / rootFontSizePx}rem`,
  "8w": `${64 / rootFontSizePx}rem`,
  "9w": `${72 / rootFontSizePx}rem`,
  "12w": `${96 / rootFontSizePx}rem`,
  "15w": `${120 / rootFontSizePx}rem`,
}

export { fonts, colors, styles, fontSizes, space, rootFontSizePx, textStyles }
