import React, {useEffect} from "react"
import {useInteractionSelector, useSearchSelector} from "../../store"
import functions from "../../functions/Functions"

let inertia = false
let mouseDown = false
let lastClientY = 0
let lastScrollY = 0
let lastDelta = 0
let smoothedDelta = 0
let lastDirection = 0
let time = new Date()
let id = 0

const DragScroll = () => {
    const {enableDrag} = useInteractionSelector()
    const {noteDrawingEnabled} = useSearchSelector()

    useEffect(() => {
        const element = document.documentElement
        if (!element) return

        const onScroll = () => {
            cancelAnimationFrame(id)
        }

        const onPointerDown = (event: PointerEvent) => {
            if (event.button === 2) return
            functions.dom.clearSelection()
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
            let dialogActive = document.querySelector(".dialog") || document.querySelector(".edit-note-dialog")
            if (dialogActive || noteDrawingEnabled) {
                mouseDown = false
                return
            }
            functions.dom.clearSelection()

            let maxSpeed = 500

            let dy = event.clientY - lastClientY
            lastClientY = event.clientY

            let smoothingFactor = 0.15
            let directionEase = 0.3

            let scrollDelta = -dy * 20

            if (scrollDelta === 0) {
                scrollDelta = lastDelta
            } else {
                lastDelta = scrollDelta
            }

            let direction = Math.sign(scrollDelta)

            if (direction && direction !== lastDirection) {
                smoothedDelta *= directionEase
                lastDirection = direction
            }

            smoothedDelta = smoothedDelta * (1 - smoothingFactor) + scrollDelta * smoothingFactor
            smoothedDelta = Math.max(Math.min(smoothedDelta, maxSpeed), -maxSpeed)

            window.scrollBy(0, smoothedDelta)
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
            mouseDown = false
            inertia = false
            disable()
        }
    }, [enableDrag, noteDrawingEnabled])

  return null
}

export default DragScroll