const Container = {
  variants: {
    responsiveContainer: {
      maxWidth: ["480px", "540px", "720px", "960px", "1140px"],
    },
    pageContainer: {
      bg: "grey.100",
      maxWidth: ["480px", "540px", "720px", "960px", "1140px"],
      borderRadius: ["0px", "0px", "10px"],
    },
    defaultAutocomplete: {
      borderRadius: "8px",
      width: "100%",
      maxWidth: "370px",
      position: "absolute",
      borderTop: "0px",
      zIndex: 1000,
      maxHeight: "480px",
      background: "#fff",
      overflowY: "auto",
      margin: "4px 0 0",
      padding: "0",
      borderTop: "0",
      boxShadow: "1px 1px 10px rgba(0, 0, 0, 0.2)",
      let: "auto",
      top: "auto",
      textAlign: "left",
    },
  },
}

export { Container }
