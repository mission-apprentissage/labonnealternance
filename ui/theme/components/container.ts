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
  },
}

export { Container }
