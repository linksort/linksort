import { useEffect } from "react";
import { useLocation } from "react-router-dom";

// https://medium.com/@romanonthego/scroll-to-top-with-react-router-and-react-hooks-87ae21785d2f
export default function ScrollToTop() {
  const { pathname, search } = useLocation();

  useEffect(() => {
    try {
      // trying to use new API - https://developer.mozilla.org/en-US/docs/Web/API/Window/scrollTo
      window.scroll({
        top: 0,
        left: 0,
        behavior: "smooth",
      });
    } catch (error) {
      // just a fallback for older browsers
      window.scrollTo(0, 0);
    }
  }, [pathname, search]);

  return null;
}
