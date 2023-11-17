const Link = {
  variants: {
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
      display: "block",
    },
    editorialContentLink: {
      color: "info",
      textDecoration: "underline",
      _hover: { color: "bluefrance.500" },
    },
    homeEditorialLink: {
      color: "#161616",
      textDecoration: "underline",
      _hover: { color: "#2A2A2A" },
    },
    postuler: {
      background: "bluefrance.500",
      border: "1px solid",
      borderColor: "bluefrance.500",
      borderRadius: "8px",
      color: "white",
      fontSize: "18px",
      fontWeight: 700,
      padding: ["6px 32px", "6px 32px", "6px 12px", "6px 32px"],
      textAlign: "center",
      _hover: {
        color: "white",
        textUnderlineOffset: "5px",
      },
    },
    basicUnderlined: {
      color: "grey.700",
      textDecoration: "underline",
      textUnderlineOffset: "5px",
      wordBreak: "break-word",
      _hover: {
        color: "grey.700",
        textDecoration: "underline",
        textUnderlineOffset: "5px",
      },
    },
  },
}

export { Link }
