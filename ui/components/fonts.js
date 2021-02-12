import React from "react";

const Fonts = ({ url }) => {
  /*const getFontFaceStyle = () => (
    <style
      dangerouslySetInnerHTML={{
        __html:
          "@font-face {font-family: 'Marianne'; src: url(" +
          url +
          "/fonts/Marianne/Marianne-ExtraBold.woff) format('woff'); font-weight: 800; font-display: swap;} @font-face { font-family: 'Marianne'; src: url(" +
          url +
          "/fonts/Marianne/Marianne-Bold.woff) format('woff'); font-weight: 700; font-display: swap; } @font-face { font-family: 'Marianne'; src: url(" +
          url +
          "/fonts/Marianne/Marianne-Medium.woff) format('woff'); font-weight: 500; font-display: swap; }  @font-face { font-family: 'Marianne'; src: url(" +
          url +
          "/fonts/Marianne/Marianne-Regular.woff) format('woff'); font-weight: 400; font-display: swap; } @font-face { font-family: 'Marianne'; src: url(" +
          url +
          "/fonts/Marianne/Marianne-Light.woff) format('woff'); font-weight: 300; font-display: swap; } @font-face { font-family: 'Marianne'; src: url(" +
          url +
          "/fonts/Marianne/Marianne-Thin.woff) format('woff'); font-weight: 200; font-display: swap; } @font-face { font-family:  'Inter'; src: url(" +
          url +
          "/fonts/Inter/Inter-Thin.ttf); font-weight: 100; font-display: swap; } @font-face { font-family:  'Inter'; src: url(" +
          url +
          "/fonts/Inter/Inter-ExtraLight.ttf); font-weight: 200; font-display: swap; } @font-face { font-family:  'Inter'; src: url(" +
          url +
          "/fonts/Inter/Inter-Light.ttf); font-weight: 300; font-display: swap; } @font-face { font-family:  'Inter'; src: url(" +
          url +
          "/fonts/Inter/Inter-Regular.ttf); font-weight: 400; font-display: swap; } @font-face { font-family:  'Inter'; src: url(" +
          url +
          "/fonts/Inter/Inter-Medium.ttf); font-weight: 500; font-display: swap; } @font-face { font-family:  'Inter'; src: url(" +
          url +
          "/fonts/Inter/Inter-SemiBold.ttf); font-weight: 600; font-display: swap; } @font-face { font-family:  'Inter'; src: url(" +
          url +
          "/fonts/Inter/Inter-Bold.ttf); font-weight: 700; font-display: swap; } @font-face { font-family:  'Inter'; src: url(" +
          url +
          "/fonts/Inter/Inter-ExtraBold.ttf); font-weight: 800; font-display: swap; } @font-face { font-family:  'Inter'; src: url(" +
          url +
          "/fonts/Inter/Inter-Black.ttf); font-weight: 900; font-display: swap; }",
      }}
    />
  );*/

  const getFontPreloadLinks = () => {
    return (
      <>
        <link
          rel="preload"
          href={`${url}/fonts/Inter/Inter-Regular.ttf`}
          as="font"
          type="font/ttf"
          crossOrigin="anonymous"
        ></link>
        <link
          rel="preload"
          href={`${url}/fonts/Marianne/Marianne-Medium.woff`}
          as="font"
          type="font/woff"
          crossOrigin="anonymous"
        ></link>
        <link
          rel="preload"
          href={`${url}/fonts/Inter/Inter-Bold.ttf`}
          as="font"
          type="font/ttf"
          crossOrigin="anonymous"
        ></link>
        <link
          rel="preload"
          href={`${url}/fonts/Inter/Inter-SemiBold.ttf`}
          as="font"
          type="font/ttf"
          crossOrigin="anonymous"
        ></link>
        <link
          rel="preload"
          href={`${url}/fonts/Marianne/Marianne-Bold.woff`}
          as="font"
          type="font/woff"
          crossOrigin="anonymous"
        ></link>
      </>
    );
  };

  return url === "neverdisplay" ? <>{getFontPreloadLinks()}</> : "";
};

export default Fonts;
