const Tabs = {
  parts: ["tablist", "tab", "tabpanel"],
  baseStyle: {
    tablist: {
      px: [0, 24],
      border: "none",
      bg: "secondaryBackground",
      color: "grey.750",
    },
    tabpanel: {
      px: [8, 24],
      color: "grey.100",
      h: 1000,
    },
    tab: {
      color: "grey.500",
      _focus: { boxShadow: "0 0 0 3px #000091", outlineColor: "bluefrance.500" },
    },
  },
  variants: {
    line: {
      tab: {
        fontSize: ["epsilon", "gamma"],
        _selected: { color: "grey.800", borderBottom: "4px solid", borderColor: "grey.750" },
      },
    },
    search: {
      tablist: {
        px: [0, 0],
        borderBottom: "1px solid #E7E7E7",
        bg: "secondaryBackground",
        color: "black",
      },
      tabpanel: {
        px: [0, 0],
        color: "black",
        h: "auto",
      },
      tab: {
        bg: "#EEF1F8",
        color: "#383838",
        fontWeight: "700",
        textStyle: "sm",
        _selected: {
          bg: "white",
          color: "bluefrance.500",
          borderTop: "2px solid #000091",
          borderLeft: "1px solid #CECECE",
          borderRight: "1px solid #CECECE",
          outline: "1px solid white",
          zIndex: "1",
        },
      },
    },
  },
}

export { Tabs }
