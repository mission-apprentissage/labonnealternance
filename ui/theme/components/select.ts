const commonFieldStyle = {
  color: "grey.800",
  borderBottomRadius: 0,
  borderWidth: 0,
  borderBottom: "2px solid",
  marginBottom: "-2px",
  borderBottomColor: "grey.600",
  bg: "grey.200",
  borderTopRadius: "4px",
  _invalid: {
    borderBottomColor: "grey.600",
    boxShadow: "none",
    outline: "2px solid",
    outlineColor: "error",
    outlineOffset: "2px",
  },
  _hover: {
    borderBottomColor: "grey.600",
  },
  _disabled: { opacity: 0.7 },
}

const Select = {
  parts: ["field"],
  variants: {
    edition: {
      field: {
        ...commonFieldStyle,
        fontWeight: 700,
      },
    },
    outline: {
      field: {
        ...commonFieldStyle,
      },
    },
  },
}

export { Select }
