"use client"
import { useEffect, useRef } from "react"

export default function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null)
  const ringRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let mouseX = -100, mouseY = -100
    let ringX = -100, ringY = -100
    let raf: number

    const onMove = (e: MouseEvent) => {
      mouseX = e.clientX
      mouseY = e.clientY
    }

    const animate = () => {
      ringX += (mouseX - ringX) * 0.12
      ringY += (mouseY - ringY) * 0.12

      if (dotRef.current) {
        dotRef.current.style.transform = `translate(${mouseX - 3}px, ${mouseY - 3}px)`
      }
      if (ringRef.current) {
        ringRef.current.style.transform = `translate(${ringX - 16}px, ${ringY - 16}px)`
      }
      raf = requestAnimationFrame(animate)
    }

    window.addEventListener("mousemove", onMove)
    raf = requestAnimationFrame(animate)

    return () => {
      window.removeEventListener("mousemove", onMove)
      cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <>
      <div
        ref={dotRef}
        className="pointer-events-none fixed top-0 left-0 z-[9999] w-1.5 h-1.5 rounded-full"
        style={{ background: "#c9a84c", willChange: "transform" }}
      />
      <div
        ref={ringRef}
        className="pointer-events-none fixed top-0 left-0 z-[9998] w-8 h-8 rounded-full"
        style={{
          border: "1px solid rgba(201,168,76,0.45)",
          willChange: "transform",
        }}
      />
    </>
  )
}
