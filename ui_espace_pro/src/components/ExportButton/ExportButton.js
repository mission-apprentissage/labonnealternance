import { ReactiveComponent } from "@appbaseio/reactivesearch"
import { Button } from "@chakra-ui/react"
import { memo, useState } from "react"

import { downloadCSV, CSV_SEPARATOR } from "../../common/utils/downloadUtils"
import { DownloadLine } from "../../theme/components/icons/Download-line"
import { _post } from "../../common/httpClient"

const serializeObject = (columns, obj) => {
  const res = []

  columns.forEach((c) => {
    let value = c.fieldName.split(".").reduce((acc, curr) => acc[curr], obj)

    if (!value) {
      value = ""
    } else if (Array.isArray(value)) {
      if (value.length && typeof value[0] === "object") {
        let values = c
          .formatter(value)
          .map((x) => Object.values(x))
          .flat()
        values.forEach((x) => {
          res.push(`${x}`.trim().replace(/"/g, "'").replace(/;/g, ",").replace(/\n/g, "").replace(/\r/g, ""))
        })
        return
      } else {
        value = value.join(",")
      }
    } else if (typeof c.formatter === "function") {
      value = c.formatter(value, obj)
    } else {
      value = `${value}`.trim().replace(/"/g, "'").replace(/;/g, ",").replace(/\n/g, "").replace(/\r/g, "")
    }
    res.push(value !== "" ? `="${value}"` : "")
  })

  return res.join(CSV_SEPARATOR)
}

let search = (index, query) => {
  return _post(
    `${process.env.REACT_APP_BASE_URL}/es/search/${index}/_search?scroll=5m`,
    {
      size: 1000,
      query: query.query,
    },
    false
  )
}

let scroll = (index, scrollId) => {
  return _post(
    `${process.env.REACT_APP_BASE_URL}/es/search/${index}/scroll?scroll=5m&scroll_id=${scrollId}`,
    {
      scroll: true,
      scroll_id: scrollId,
      activeQuery: {
        scroll: "1m",
        scroll_id: scrollId,
      },
    },
    false
  )
}

let duplicateFromByOffer = (data) => {
  let buffer = []
  data.map((form) => {
    if (form.offres.length > 1) {
      form.offres.forEach((offre) => {
        buffer.push({ ...form, offres: [offre] })
      })
    } else {
      buffer.push(form)
    }
  })

  return buffer
}

let getDataAsCSV = async (searchUrl, query, columns, setProgress) => {
  let data = []
  let pushAll = (hits) => {
    let total = hits.total.value
    data = [...data, ...hits.hits.map((h) => h._source)]
    setProgress(Math.round((data.length * 100) / total))
  }

  let { hits, _scroll_id } = await search(searchUrl, query)

  pushAll(hits)

  while (data.length < hits.total.value) {
    let { hits } = await scroll(searchUrl, _scroll_id)
    pushAll(hits)
  }

  data = duplicateFromByOffer(data)

  let headers = columns.map((c) => c.header).join(CSV_SEPARATOR) + "\n"
  let lines = data.map((obj) => serializeObject(columns, obj)).join("\n")
  setProgress(100)
  return `${headers}${lines}`
}

const ExportButton = ({ index, filters, columns, defaultQuery = { query: { match_all: {} } } }) => {
  const [requestExport, setRequestExport] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [progress, setProgress] = useState(0)

  if (!requestExport) {
    return (
      <Button
        variant="pill"
        py={2}
        onClick={async () => {
          setRequestExport(true)
          setExporting(true)
        }}
      >
        <DownloadLine mx="0.5rem" w="0.75rem" h="0.75rem" />
        Exporter
      </Button>
    )
  }

  const onQueryChange = async (prevQuery, nextQuery) => {
    let csv = await getDataAsCSV(index, nextQuery, columns, setProgress)
    let fileName = `${index}_${new Date().toJSON()}.csv`
    downloadCSV(fileName, csv)
    setExporting(false)
    setRequestExport(false)
    setProgress(0)
  }

  return (
    <ReactiveComponent
      componentId={`${index}-export`}
      react={{ and: filters }}
      onQueryChange={onQueryChange}
      defaultQuery={defaultQuery}
      render={() => {
        if (exporting) {
          return (
            <Button isLoading size="sm" variant="pill" py={2} loadingText={`${progress}%`}>
              Exporter
            </Button>
          )
        }
        return <div />
      }}
    />
  )
}

export default memo(ExportButton)
