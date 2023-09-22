const Input = {
  parts: ["field"],
  baseStyle: {
    field: {
      _readOnly: {
        borderColor: "grey.400",
      },
    },
  },
  variants: {
    edition: {
      field: {
        borderRadius: 0,
        fontWeight: 700,
        bg: "grey.200",
        color: "grey.800",
        border: "1px solid",
        borderColor: "bluefrance.500",
      },
    },
    outline: {
      field: {
        borderBottomRadius: 0,
        borderWidth: 0,
        borderBottom: "2px solid",
        marginBottom: "-2px",
        borderColor: "grey.600",
        bg: "grey.200",
        _readOnly: {
          borderColor: "grey.400",
          userSelect: "none",
        },
      },
    },
    search: {
      field: {
        border: "none",
        borderBottom: "2px solid #000091",
        borderRadius: "4px 4px 0 0",
        background: "#f0f0f0",
        color: "#1e1e1e",
      },
    },
    defaultAutocomplete: {
      field: {
        fontSize: "14px",
        fontWeight: 600,
        background: "white",
        px: 0.5,
        py: "1px",
        mb: "1px",
        height: "32px",
        width: "95%",
        marginLeft: "5px",
        border: "none !important",
        _placeholder: {
          color: "grey.500",
          lineHeight: "17px",
          letterSpacing: "0px",
          fontWeight: 400,
          fontSize: "14px",
        },
      },
    },
    homeAutocomplete: {
      field: {
        fontSize: "16px",
        fontWeight: 600,
        background: "white",
        px: 0.5,
        py: "1px",
        mb: "1px",
        height: "32px",
        width: "95%",
        marginLeft: "5px",
        border: "none !important",
        _placeholder: {
          color: "grey.500",
          lineHeight: "17px",
          letterSpacing: "0px",
          fontWeight: 400,
          fontSize: "16px",
        },
      },
    },
  },
}

export { Input }
