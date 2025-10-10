import React, {useEffect} from "react"
import {useInteractionSelector} from "../../store"

let inertia = false
let mouseDown = false
let lastClientY = 0
let lastScrollY = 0
let lastGoodDelta = 0
let time = new Date()
let id = 0

const DragScroll = () => {
    const {enableDrag} = useInteractionSelector()

    useEffect(() => {
        const element = document.documentElement
        if (!element) return

        const onScroll = () => {
            cancelAnimationFrame(id)
        }

        const onPointerDown = (event: PointerEvent) => {
            if (event.button === 2) return
            window.getSelection()?.removeAllRanges()
            mouseDown = true
            inertia = false
            time = new Date()
            lastClientY = event.clientY
            lastScrollY = window.scrollY
        }

        const onPointerUp = (event: PointerEvent) => {
            mouseDown = false
            const timeDiff = (new Date().getTime() - time.getTime())
            let speedY = (window.scrollY - lastScrollY) / timeDiff * 25
            let speedYAbsolute = Math.abs(speedY)

            const animate = () => {
                if (!inertia) return
                if (speedYAbsolute > 0) {
                    if (speedY > 0) {
                        window.scrollBy(0, speedYAbsolute--)
                    } else {
                        window.scrollBy(0, -speedYAbsolute--)
                    }
                    id = requestAnimationFrame(animate)
                } else {
                    inertia = false
                    cancelAnimationFrame(id)
                }
            }
            inertia = true
            animate()
        }

        const onPointerMove = (event: PointerEvent) => {
            if (!mouseDown) return
            window.getSelection()?.removeAllRanges()

            const dy = event.clientY - lastClientY
            lastClientY = event.clientY

            let scrollDelta = -dy * 12

            if (scrollDelta === 0) {
                scrollDelta = lastGoodDelta
            } else {
                lastGoodDelta = scrollDelta
            }

            window.scrollBy(0, scrollDelta)
            lastScrollY = window.scrollY
        }

        const enable = () => {
            element.addEventListener("pointerdown", onPointerDown)
            window.addEventListener("pointermove", onPointerMove)
            window.addEventListener("pointerup", onPointerUp)
            window.addEventListener("scroll", onScroll)
            window.addEventListener("dragstart", onScroll)
        }

        const disable = () => {
            element.removeEventListener("pointerdown", onPointerDown)
            window.removeEventListener("pointermove", onPointerMove)
            window.removeEventListener("pointerup", onPointerUp)
            window.removeEventListener("scroll", onScroll)
            window.removeEventListener("dragstart", onScroll)
        }

        enableDrag ? enable() : disable()

        return () => {
            disable()
        }
    }, [enableDrag])

  return null
}

export default DragScroll