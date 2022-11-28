const Text = {
  baseStyle: {
    fontFamily: "Marianne, Arial",
  },
  variants: {
    highlight: {
      bg: "#f9f8f6",
      px: 2,
      py: 0.5,
      fontWeight: 700,
    },
    homeEditorialH1: {
      color: "#000091",
      fontSize: "32px",
      lineHeight: "40px",
      fontWeight: 700,
    },
    homeEditorialH2: {
      color: "#3A3A3A",
      fontSize: "28px",
      lineHeight: "36px",
      fontWeight: 700,
    },
    homeEditorialText: {
      color: "#161616",
      fontSize: "18px",
      lineHeight: "28px",
      fontWeight: 400,
    },
    editorialContentH1: {
      color: "info",
      fontSize: "40px",
      fontWeight: 700,
      lineHeight: 1.2,
      marginBottom: "0.5rem",
    },

    editorialContentH2: {
      color: "grey.750",
      fontSize: "18px",
      fontWeight: 700,
      lineHeight: "22px",
      marginBottom: "2.5rem",
      marginTop: "2.5rem",
      textAlign: "left",
    },

    editorialContentH3: {
      fontSize: "1.75rem",
      fontWeight: 500,
      lineHeight: 1.2,
      marginBottom: "0.5rem",
    },

    tag: {
      fontSize: "12px",
      fontWeight: 700,
      display: "inline-flex",
      lineHeight: "15px",
      letterSpacing: "0px",
      margin: "3px 4px 0 0",
      width: "max-content",
      borderRadius: "6px",
      padding: "0.5rem",
      paddingTop: "0.25rem",
      alignItems: "center",
    },

    defaultAutocomplete: {
      marginBottom: "0",
      marginLeft: 2,
      paddingTop: "0.3rem",
      color: "grey.700",
      textAlign: "left",
      lineHeight: "15px",
      fontSize: ["12px", "10px", "10px", "12px"],
    },
  },
}

export { Text }
