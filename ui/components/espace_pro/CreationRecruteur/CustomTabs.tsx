import { Tab, TabList, TabPanel, TabPanels, Tabs } from "@chakra-ui/react"

export const CustomTabs = <Name extends string>({
  panels,
  currentTab,
  onChange,
}: {
  panels: readonly { id: Name; title: React.ReactNode; content: React.ReactNode }[]
  currentTab: Name
  onChange: (newTab: Name) => void
}) => {
  let currentIndex = panels.findIndex(({ id }) => id === currentTab)
  if (currentIndex === -1) {
    currentIndex = 0
  }
  const setTabIndex = (index: number) => {
    const panel = panels[index % panels.length]
    onChange(panel.id)
  }

  return (
    <Tabs index={currentIndex} onChange={(index) => setTabIndex(index)} variant="search" isLazy>
      <TabList display="flex" gap="6px">
        {panels.map(({ title, id }) => (
          <Tab
            key={id}
            sx={{
              color: "#161616",
              backgroundColor: "#E3E3FD",
              fontWeight: 700,
            }}
          >
            {title}
          </Tab>
        ))}
      </TabList>
      <TabPanels paddingTop="19px">
        {panels.map(({ id, content }) => (
          <TabPanel key={id} sx={{ padding: 0 }}>
            {content}
          </TabPanel>
        ))}
      </TabPanels>
    </Tabs>
  )
}
