import { useState, useEffect } from "react"

function getScrollPosition() {
  return { x: window.pageXOffset, y: window.pageYOffset }
}

export default function useScrollPosition() {
  const [position, setScrollPosition] = useState(getScrollPosition())

  useEffect(() => {
    let requestRunning = null
    function handleScroll() {
      if (requestRunning === null) {
        requestRunning = window.requestAnimationFrame(() => {
          setScrollPosition(getScrollPosition())
          requestRunning = null
        })
      }
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return position
}
