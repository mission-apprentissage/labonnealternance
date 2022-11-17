const Link = {
  baseStyle: {
    _focus: {
      // boxShadow: '0 0 0 3px #000091',
      // outlineColor: 'bluefrance.500',
      boxShadow: "none",
    },
  },
  variants: {
    unstyled: {
      _focus: { boxShadow: "none", outlineColor: "none" },
    },
    classic: {
      textDecoration: "underline",
      fontWeight: "700",
      mx: 1,
    },
    card: {
      p: 8,
      my: 3,
      bg: "white",
      _hover: { bg: "#eceae3", textDecoration: "none" },
      _focus: { boxShadow: "none", outlineColor: "none" },
      display: "block",
    },
  },
}

export { Link }
