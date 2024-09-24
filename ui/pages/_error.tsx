import * as Sentry from "@sentry/nextjs"
import NextErrorComponent from "next/error"

const CustomError = (props: { statusCode: number }) => {
  const { statusCode } = props
  return <NextErrorComponent statusCode={statusCode} />
}

CustomError.getInitialProps = async (context: Parameters<typeof NextErrorComponent.getInitialProps>[0]) => {
  // Running on the server, the response object (`res`) is available.
  //
  // Next.js will pass an err on the server if a page's data fetching methods
  // threw or returned a Promise that rejected
  //
  // Running on the client (browser), Next.js will provide an err if:
  //
  //  - a page's `getInitialProps` threw or returned a Promise that rejected
  //  - an exception was thrown somewhere in the React lifecycle (render,
  //    componentDidMount, etc) that was caught by Next.js's React Error
  //    Boundary. Read more about what types of exceptions are caught by Error
  //    Boundaries: https://reactjs.org/docs/error-boundaries.html

  const { res, err } = context
  if (res?.statusCode === 404) {
    // Opinionated: do not record an exception in Sentry for 404
    return { statusCode: 404 }
  }
  if (err) {
    await Sentry.captureUnderscoreErrorException(context)
  }
  return NextErrorComponent.getInitialProps(context)
}

export default CustomError
