"use client"

import { useState, useRef, useCallback, useEffect } from "react"

interface HeroVideoProps {
  videos?: string[]
}

const DEFAULT_VIDEOS = ["/hero-car.mp4", "/hero-home.mp4", "/hero-detail.mp4", "/hero-office.mp4", "/hero-fleet.mp4"]

export function HeroVideo({ videos = DEFAULT_VIDEOS }: HeroVideoProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const videoRef = useRef<HTMLVideoElement>(null)

  // Force play on mount and when video changes — mobile browsers need this
  useEffect(() => {
    const v = videoRef.current
    if (!v) return

    const tryPlay = () => {
      v.play().catch(() => {
        // Autoplay blocked — silently ignore, purple overlay still shows
      })
    }

    // Try immediately
    tryPlay()

    // Also retry when metadata/data is ready (mobile may need this)
    v.addEventListener("loadeddata", tryPlay)
    v.addEventListener("canplay", tryPlay)

    // Some mobile browsers block autoplay until user interacts with the page.
    // Retry on first touch/scroll/click.
    const onInteraction = () => {
      tryPlay()
      cleanup()
    }
    const cleanup = () => {
      document.removeEventListener("touchstart", onInteraction)
      document.removeEventListener("scroll", onInteraction)
      document.removeEventListener("click", onInteraction)
    }
    document.addEventListener("touchstart", onInteraction, { once: true, passive: true })
    document.addEventListener("scroll", onInteraction, { once: true, passive: true })
    document.addEventListener("click", onInteraction, { once: true })

    // Also use IntersectionObserver to play when visible
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) tryPlay()
        })
      },
      { threshold: 0.25 }
    )
    observer.observe(v)

    return () => {
      v.removeEventListener("loadeddata", tryPlay)
      v.removeEventListener("canplay", tryPlay)
      cleanup()
      observer.disconnect()
    }
  }, [currentIndex])

  const handleEnded = useCallback(() => {
    if (videos.length <= 1) {
      if (videoRef.current) {
        videoRef.current.currentTime = 0
        videoRef.current.play().catch(() => {})
      }
      return
    }
    const next = (currentIndex + 1) % videos.length
    setCurrentIndex(next)
  }, [currentIndex, videos])

  return (
    <video
      key={currentIndex}
      ref={videoRef}
      src={videos[currentIndex]}
      autoPlay
      muted
      playsInline
      preload="auto"
      onEnded={handleEnded}
      className="absolute inset-0 h-full w-full object-cover"
      // eslint-disable-next-line react/no-unknown-property
      {...({ "webkit-playsinline": "true" } as Record<string, string>)}
    />
  )
}
