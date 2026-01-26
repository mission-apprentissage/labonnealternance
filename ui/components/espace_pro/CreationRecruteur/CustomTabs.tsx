import { Box, Tab, Tabs } from "@mui/material"

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props

  return (
    <div role="tabpanel" hidden={value !== index} id={`tabpanel-${index}`} aria-labelledby={`tab-${index}`} {...other}>
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  )
}

export const tabSx = {
  color: "#161616",
  backgroundColor: "#E3E3FD",
  "&.Mui-selected": {
    color: "#000091",
    backgroundColor: "white",
    borderBottom: "none",
    borderLeft: "1px solid #ddd",
    borderRight: "1px solid #ddd",
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
        <Tabs value={value} onChange={handleChange} variant="scrollable" scrollButtons="auto" allowScrollButtonsMobile>
          {panels.map(({ title, id }) => (
            <Tab sx={tabSx} key={id} label={title} />
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
