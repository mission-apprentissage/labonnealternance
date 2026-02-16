import { fr } from "@codegouvfr/react-dsfr"
import { Box, Tab, Tabs } from "@mui/material"
import { fr } from "@codegouvfr/react-dsfr"

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props

  return (
    <div role="tabpanel" hidden={value !== index} id={`tabpanel-${index}`} aria-labelledby={`tab-${index}`} {...other}>
      {value === index && <Box sx={{ pt: fr.spacing("6v") }}>{children}</Box>}
    </div>
  )
}

export const tabSx = {
  "& .MuiTabs-flexContainer": {
    gap: 1,
  },

  // Style des tabs individuels
  "& .MuiTab-root": {
    // Normal
    backgroundColor: "#E3E3FD",
    color: "#161616",
    fontWeight: "bold",
    paddingY: fr.spacing("2v"),
    paddingX: fr.spacing("4v"),
    outline: "none",
    textTransform: "none",

    // Hover
    "&:hover": {
      backgroundColor: "#C1C1FB",
    },

    // Focus
    "&.Mui-focusVisible": {
      backgroundColor: "#C1C1FB",
      outline: "2px solid #6A6AF4",
    },

    // Selected
    "&.Mui-selected": {
      color: "primary.main",
      backgroundColor: "#fff",
      borderLeft: "1px solid #DDD",
      borderRight: "1px solid #DDD",
      // Hover
      "&:hover": {
        backgroundColor: "#C1C1FB",
      },
    },
    // Selected
    "&.Mui-selected.Mui-focusVisible": {
      color: "primary.main",
      backgroundColor: "#C1C1FB",
    },
  },
}
export const CustomTabs = <Name extends string>({
  panels,
  currentTab,
  onChange,
}: {
  panels: readonly { id: Name; title: React.ReactNode; content: React.ReactNode }[]
  currentTab: Name
  onChange: (newTab: Name) => void
}) => {
  const currentIndex = panels.findIndex(({ id }) => id === currentTab)
  const value = currentIndex !== -1 ? currentIndex : 0

  const handleChange = (_event: React.SyntheticEvent, newValue: number) => {
    onChange(panels[newValue].id)
  }

  const currentPanel = panels[currentIndex]

  return (
    <>
      <Box>
        <Tabs
          value={value}
          onChange={handleChange}
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
          slotProps={{ indicator: { sx: { top: 0, bottom: "auto", height: "3px", backgroundColor: "primary.main" } } }}
          sx={tabSx}
        >
          {panels.map(({ title, id }) => (
            <Tab disableRipple key={id} label={title} />
          ))}
        </Tabs>
      </Box>
      <Box>
        <TabPanel value={value} index={currentIndex}>
          {currentPanel.content}
        </TabPanel>
      </Box>
    </>
  )
}
