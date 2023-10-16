export const isInitialServerSideProps = (context) => context.req?.url?.indexOf("/_next/data/") === -1
