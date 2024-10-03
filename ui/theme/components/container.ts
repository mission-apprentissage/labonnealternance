const Container = {
  variants: {
    responsiveContainer: {
      maxWidth: ["576px", "768px", "992px", "1248px"],
    },
    pageContainer: {
      bg: "grey.100",
      maxWidth: ["576px", "768px", "992px", "1248px"],
      borderRadius: ["0px", "0px", "10px"],
    },
    whitePageContainer: {
      maxWidth: ["576px", "768px", "992px", "1248px"],
      borderRadius: ["0px", "0px", "10px"],
    },
    defaultAutocomplete: {
      borderRadius: "8px",
      width: "100%",
      maxWidth: "370px",
      position: "absolute",
      borderTop: "0px",
      zIndex: 1000,
      maxHeight: "576px",
      background: "#fff",
      overflowY: "auto",
      margin: "4px 0 0",
      padding: "0",
      boxShadow: "1px 1px 10px rgba(0, 0, 0, 0.2)",
      left: "auto",
      top: "auto",
      textAlign: "left",
    },
  },
}

export { Container }
