const commonButtonStyle = {
  borderRadius: 0,
  textTransform: "none",
  fontWeight: 400,
  _focus: { boxShadow: "0px 0px 0px 2px #FFFFFF, 0px 0px 0px 4px #0A76F6" },
  _focusVisible: { boxShadow: "0px 0px 0px 2px #FFFFFF, 0px 0px 0px 4px #0A76F6" },
  _hover: { bg: "bluefrance.113" },
}

const Button = {
  variants: {
    popover: {
      width: 0,
      height: 0,
      size: "xs",
      bg: "pink",
      _hover: {
        bg: "none",
        boxShadow: "none",
      },
      _active: {
        bg: "none",
      },
      _focus: {
        bg: "none",
        boxShadow: "none",
      },
    },
    form: {
      ...commonButtonStyle,
      bg: "grey.200",
      color: "grey.600",
      _active: {
        bg: "bluefrance.500",
        color: "white",
        _hover: {
          bg: "bluefrance.113",
        },
      },
      _hover: {
        _disabled: {
          _hover: {
            bg: "grey.200",
          },
        },
      },
      _disabled: {
        opacity: 1,
        bg: "grey.200",
        color: "grey.600",
      },
    },
    secondary: {
      ...commonButtonStyle,
      bg: "white",
      color: "bluefrance.500",
      border: "1px solid",
      borderColor: "bluefrance.500",
      _hover: { bg: "grey.200" },
      _focus: {
        boxShadow: "none",
      },
      _active: {
        bg: "bluefrance.500",
        color: "white",
      },
    },
    primary: {
      ...commonButtonStyle,
      bg: "bluefrance.500",
      color: "white",
    },
    editorialPrimary: {
      ...commonButtonStyle,
      bg: "info",
      borderRadius: "8px",
      color: "white",
      _hover: { bg: "info", color: "white", textDecoration: "underline", boxShadow: "0 0 12px 2px rgb(0 0 0 / 21%)" },
    },
    blackButton: {
      ...commonButtonStyle,
      bg: "grey.750",
      borderRadius: "8px",
      color: "white",
      _hover: { textDecoration: "underline", boxShadow: "0 0 12px 2px rgb(0 0 0 / 21%)" },
    },
    "primary-red": {
      ...commonButtonStyle,
      bg: "#CC144A",
      color: "white",
    },
    pill: {
      ...commonButtonStyle,
      borderRadius: 24,
      height: "auto",
      // fontSize: 'zeta',
      color: "bluefrance",
      px: 3,
      py: 1,
      _hover: { bg: "bluefrance.100", textDecoration: "none" },
    },
    navdot: {
      _focus: {
        boxShadow: "none",
      },
      borderRadius: "0px",
      p: "2px",
      _hover: { bg: "bluefrance.100", textDecoration: "none" },
      _active: {
        bg: "bluefrance.100",
      },
    },
    centerSearch: {
      display: "flex",
      cursor: "pointer",
      background: "none",
      border: "none",
      padding: "0px 5px 10px 0",
      fontSize: "14px",
      width: "fit-content",
      _hover: {
        background: "white",
      },
    },
    knowMore: {
      color: "grey.700",
      fontSize: "14px",
      fontWeight: 400,
      width: "max-content",
      height: "auto",
      padding: "0 0 5px 0",
      borderRadius: "none",
      marginLeft: "auto",
      lineHeight: "17px",
      background: "none",
      border: "none",
      borderBottom: "2px solid",
      borderColor: "grey.700",
      _hover: {
        color: "black",
      },
    },
  },
}

export { Button }
