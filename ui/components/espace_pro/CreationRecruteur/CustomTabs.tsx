import { fr } from "@codegouvfr/react-dsfr"
import { TabContext, TabList, TabPanel } from "@mui/lab"
import { Box, Tab } from "@mui/material"

export const CustomTabs = <Name extends string>({
  panels,
  currentTab,
  onChange,
}: {
  panels: readonly { id: Name; title: React.ReactNode; content: React.ReactNode }[]
  currentTab: Name
  onChange: (newTab: Name) => void
}) => {
  let currentPanel = panels.find(({ id }) => id === currentTab)
  if (!currentPanel) {
    currentPanel = panels[0]
  }

  const setTabIndex = (tab) => {
    const panel = panels.find(({ id }) => id === tab)
    onChange(panel.id)
  }

  return (
    <TabContext value={currentPanel.id}>
      <Box sx={{ xs: 0, sm: fr.spacing("1v"), md: fr.spacing("4w") }} className="fr-tabs">
        <TabList
          sx={{ maxWidth: "90%", px: { xs: 0, sm: "inherit" } }}
          className="fr-tabs__list"
          onChange={(_, index) => setTabIndex(index)}
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
        >
          {panels.map(({ title, id }) => (
            <Tab key={id} label={title} value={id} className="fr-tabs__tab" wrapped />
          ))}
        </TabList>
      </Box>
      <Box mt={fr.spacing("4w")}>
        {panels.map(({ id, content }) => (
          <TabPanel value={id} key={id} sx={{ padding: 0 }}>
            {content}
          </TabPanel>
        ))}
      </Box>
    </TabContext>
  )
}
