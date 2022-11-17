import { memo } from "react"
import { MultiList } from "@appbaseio/reactivesearch"
import { Accordion, AccordionButton, AccordionItem, AccordionPanel, Box } from "@chakra-ui/react"

import "./facet.css"

import { AddFill, SubtractLine } from "../../theme/components/icons"

const Facet = ({
  componentId,
  dataField,
  nestedField,
  filterLabel,
  filters,
  defaultQuery,
  transformData,
  customQuery,
  title,
  showSearch,
  showCount,
  excludedFields,
  selectAllLabel,
}) => {
  return (
    <Accordion allowMultiple bg="white" my={3}>
      <AccordionItem border="none">
        {({ isExpanded }) => (
          <>
            <h2>
              <AccordionButton>
                <Box flex="1" textAlign="left">
                  {title}
                </Box>
                {isExpanded ? <SubtractLine boxSize={3.5} color="bluefrance.500" /> : <AddFill boxSize={3.5} color="bluefrance.500" />}
              </AccordionButton>
            </h2>
            <AccordionPanel pb={4}>
              <MultiList
                className="facet-filters"
                componentId={componentId}
                dataField={dataField}
                nestedField={nestedField}
                filterLabel={filterLabel}
                selectAllLabel={selectAllLabel}
                react={{ and: filters.filter((e) => e !== componentId) }}
                defaultQuery={defaultQuery}
                transformData={transformData}
                customQuery={customQuery}
                showCount={showCount}
                excludeFields={excludedFields}
                queryFormat="or"
                missingLabel="(Vide)"
                showCheckbox={true}
                innerClass={{
                  title: "search-title",
                  input: "search-input",
                  checkbox: "search-checkbox",
                  label: "search-label",
                }}
                showSearch={showSearch}
                placeholder="Filtrer"
                loader="Chargement"
                URLParams={true}
              />
            </AccordionPanel>
          </>
        )}
      </AccordionItem>
    </Accordion>
  )
}

export default memo(Facet)
