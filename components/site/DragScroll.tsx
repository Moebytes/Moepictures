import React, {useEffect, useState} from "react"
import {useHistory} from "react-router-dom"
import {useInteractionSelector} from "../../store"
import functions from "../../structures/Functions"

let inertia = false
let mouseDown = false
let lastClientY = 0
let lastScrollTop = 0
let time = new Date()
let id = 0

const DragScroll = ({children}) => {
    const {enableDrag} = useInteractionSelector()
    const history = useHistory()

    useEffect(() => {
        const element = document.documentElement
        if (!element) return

        const onScroll = (event: Event) => {
            cancelAnimationFrame(id)
            return false
        }

        const onMouseDown = (event: MouseEvent) => {
            if (event.button === 2) return
            functions.clearSelection()
            mouseDown = true
            inertia = false
            time = new Date()
            lastClientY = event.clientY
            lastScrollTop = element.scrollTop
        }

        const onMouseUp = () => {
            mouseDown = false
            const timeDiff = (new Date().getTime() - time.getTime())
            let speedY = (element.scrollTop - lastScrollTop) / timeDiff * 25
            let speedYAbsolute = Math.abs(speedY)
            const animateInertia = () => {
                if (speedYAbsolute > 0) {
                    if (speedY > 0) {
                        element.scrollTop += speedYAbsolute--
                    } else {
                        element.scrollTop -= speedYAbsolute--
                    }
                    id = requestAnimationFrame(animateInertia)
                } else {
                    inertia = false
                    cancelAnimationFrame(id)
                }
            }
            inertia = true
            animateInertia()
        }

        const onMouseMove = (event: MouseEvent) => {
            if (!mouseDown) return
            functions.clearSelection()
            let newScrollY = (event.clientY - lastClientY) * 12
            element.scrollTop -= newScrollY
            lastClientY = event.clientY
            lastScrollTop = element.scrollTop
        }

        const enable = () => {
            window.addEventListener("mousedown", onMouseDown, false)
            window.addEventListener("mousemove", onMouseMove, false)
            window.addEventListener("mouseup", onMouseUp, false)
            window.addEventListener("scroll", onScroll, false)
            window.addEventListener("dragstart", onScroll, false)
        }

        const disable = () => {
            window.removeEventListener("mousedown", onMouseDown, false)
            window.removeEventListener("mousemove", onMouseMove, false)
            window.removeEventListener("mouseup", onMouseUp, false)
            window.removeEventListener("scroll", onScroll, false)
            window.removeEventListener("dragstart", onScroll, false)
        }

        enableDrag ? enable() : disable()

        return () => {
            disable()
        }
    }, [enableDrag, history])


  return <>{children}</>
}

export default DragScroll