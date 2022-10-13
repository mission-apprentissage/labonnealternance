import React, { useEffect } from "react";
import { scrollToTop } from "../../utils/tools";

const ScrollToTop = ({ elementId }) => {
  useEffect(() => {
    scrollToTop(elementId);
  });
  return <></>;
};

export default ScrollToTop;
