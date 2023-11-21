import React from "react"

import Layout from "../../Layout"

export const DepotSimplifieLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <Layout header={false} displayNavigationMenu={false}>
      {children}
    </Layout>
  )
}
