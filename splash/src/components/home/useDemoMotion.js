import { useEffect, useState } from "react"
import { useReducedMotion } from "framer-motion"

// Motion helpers shared by the scripted demos (AssistantDemo, SummaryDemo).

// Types `text` in a few characters at a time once `active` is true. Returns
// [shown, done]. Under prefers-reduced-motion the full text is shown at once.
export function useTypewriter(text, active, speed = 14, step = 3) {
  const reduce = useReducedMotion()
  const [shown, setShown] = useState(reduce ? text : "")
  const [done, setDone] = useState(Boolean(reduce))
  useEffect(() => {
    if (!active) return
    if (reduce) {
      setShown(text)
      setDone(true)
      return
    }
    let i = 0
    setShown("")
    setDone(false)
    const id = setInterval(() => {
      i += step
      setShown(text.slice(0, i))
      if (i >= text.length) {
        clearInterval(id)
        setDone(true)
      }
    }, speed)
    return () => clearInterval(id)
  }, [text, active, reduce, speed, step])
  return [shown, done]
}

// Flips to true once the element in `ref` scrolls into view, then stops
// observing. Returns [inView, setInView] so a demo can reset itself to replay.
export function useInView(ref, threshold = 0.4) {
  const [inView, setInView] = useState(false)
  useEffect(() => {
    if (inView || typeof IntersectionObserver === "undefined") return
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      entries => {
        if (entries.some(e => e.isIntersecting)) {
          setInView(true)
          io.disconnect()
        }
      },
      { threshold },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [ref, inView, threshold])
  return [inView, setInView]
}
