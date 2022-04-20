import React, {useContext, useEffect, useRef, useState} from "react"
import {ThemeContext, EnableDragContext} from "../Context"
import {HashLink as Link} from "react-router-hash-link"
import functions from "../structures/Functions"
import arrowLeft from "../assets/purple/carousel-left.png"
import arrowRight from "../assets/purple/carousel-right.png"
import arrowLeftPurpleLight from "../assets/purple-light/carousel-left.png"
import arrowRightPurpleLight from "../assets/purple-light/carousel-right.png"
import arrowLeftMagenta from "../assets/magenta/carousel-left.png"
import arrowRightMagenta from "../assets/magenta/carousel-right.png"
import arrowLeftMagentaLight from "../assets/magenta-light/carousel-left.png"
import arrowRightMagentaLight from "../assets/magenta-light/carousel-right.png"
import "./styles/carousel.less"

interface Props {
    set?: (img: string, index: number) => any
    noKey?: boolean
    images: any[]
    height?: number
    index?: number
}

let startX = 0

const Carousel: React.FunctionComponent<Props> = (props) => {
    const {theme, setTheme} = useContext(ThemeContext)
    const {enableDrag, setEnableDrag} = useContext(EnableDragContext)
    const [lastPos, setLastPos] = useState(null) as any
    const [dragging, setDragging] = useState(false) as any
    const [imagesRef, setImagesRef] = useState(props.images.map(() => React.createRef())) as any
    const [lastActive, setLastActive] = useState(imagesRef[props.index ? props.index : 0])
    const [active, setActive] = useState(imagesRef[props.index ? props.index : 0])
    const [showLeftArrow, setShowLeftArrow] = useState(false)
    const [showRightArrow, setShowRightArrow] = useState(false)
    const sliderRef = useRef<any>(null)

    useEffect(() => {
        const newImagesRef = props.images.map(() => React.createRef()) as any
        setImagesRef(newImagesRef) as any
        setActive(newImagesRef[props.index ? props.index : 0])
        setLastActive(newImagesRef[props.index ? props.index : 0])
        setShowLeftArrow(false)
        setShowRightArrow(false)
        setLastPos(null)
        setDragging(false)
    }, [props.images])

    useEffect(() => {
        if (props.index !== undefined) {
            setActive(imagesRef[props.index])
        }
    }, [props.index])

    const getArrowLeft = () => {
        if (theme === "purple") return arrowLeft
        if (theme === "magenta") return arrowLeftMagenta
        if (theme === "purple-light") return arrowLeftPurpleLight
        if (theme === "magenta-light") return arrowLeftMagentaLight
        return arrowLeft
    }

    const getArrowRight = () => {
        if (theme === "purple") return arrowRight
        if (theme === "magenta") return arrowRightMagenta
        if (theme === "purple-light") return arrowRightPurpleLight
        if (theme === "magenta-light") return arrowRightMagentaLight
        return arrowRight
    }

    const handleIntersection = (entries: any) => {
        for (let entry of entries) {
            if (entry.intersectionRatio === 1) {
                if (!sliderRef.current) return
                const margin = parseInt(sliderRef.current.style.marginLeft)
                if (margin < 0) setLastPos(margin)
            }
        }
    }
    let entriesSeen = new Set()
    const handleResize = (entries: any) => {
        for (let entry of entries) {
            if (!entriesSeen.has(entry.target)) {
                entriesSeen.add(entry.target)
            } else {
                setLastPos(null)
            }
        }
    }

    const handleKeydown = (event: any) => {
        if (props.noKey) return
        if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return
        if (!sliderRef.current) return
        let marginLeft = parseInt(sliderRef.current.style.marginLeft)
        if (Number.isNaN(marginLeft)) marginLeft = 0
        const width = document.querySelector(".carousel-img")?.clientWidth || 0
        let index = imagesRef.indexOf(active)
        if (event.key === "ArrowLeft") {
            index-- 
            marginLeft += width
        } else if (event.key === "ArrowRight") {
            index++
            marginLeft -= width
        } 
        if (index < 0) index = 0
        if (index > imagesRef.length - 1) index = imagesRef.length - 1
        if (props.set) props.set(props.images[index], index)
        setActive(imagesRef[index])

        if (marginLeft > 0) marginLeft = 0
        if (lastPos) if (marginLeft < lastPos) marginLeft = lastPos
        if (index < 5 || index > imagesRef.length - 6) return
        sliderRef.current.style.transition = "margin-left 0.75s"
        sliderRef.current.style.marginLeft = `${marginLeft}px`
        setTimeout(() => {
            if (!sliderRef.current) return
            sliderRef.current.style.transition = "margin-left 0.05s"
        }, 1000)
    }

    useEffect(() => {
        if (typeof window === "undefined") return
        window.addEventListener("keydown", handleKeydown)
        sliderRef.current.addEventListener("wheel", handleWheel, {passive: false})
        const observer = new IntersectionObserver(handleIntersection, {root: null, rootMargin: "20px", threshold: 1})
        const resizeObserver = new ResizeObserver(handleResize)
        const element = imagesRef[imagesRef.length - 1]?.current
        if (element) {
            observer.observe(element)
            resizeObserver.observe(element)
        }
        return () => {
            window.removeEventListener("keydown", handleKeydown)
            sliderRef.current.removeEventListener("wheel", handleWheel, {passive: false})
            observer.disconnect()
            resizeObserver.disconnect()
        }
    })

    useEffect(() => {
        for (let i = 0; i < imagesRef.length; i++) {
            if (imagesRef[i].current) imagesRef[i].current.style.border = "0"
        }
        if (active.current) active.current.style.border = "3px solid var(--text)"
        setLastActive(active)
    }, [active])

    const generateJSX = () => {
        const jsx = [] as any
        for (let i = 0; i < props.images.length; i++) {
            const img = props.images[i]
            if (functions.isVideo(img)) {
                jsx.push(<video autoPlay muted loop disablePictureInPicture ref={imagesRef[i]} className="carousel-img" src={img} onClick={() => {props.set?.(img, i); setActive(imagesRef[i])}} style={props.height ? {height: `${props.height}px`} : {}}></video>)
            } else {
                jsx.push(<img ref={imagesRef[i]} className="carousel-img" src={img} onClick={() => {props.set?.(img, i); setActive(imagesRef[i])}} style={props.height ? {height: `${props.height}px`} : {}}/>)
            }
        }
        return jsx
    }

    const handleWheel = (event: any) => {
        event.preventDefault()
        if (!sliderRef.current) return
        let marginLeft = parseInt(sliderRef.current.style.marginLeft)
        if (Number.isNaN(marginLeft)) marginLeft = 0
        const trackPad = event.wheelDeltaY ? event.wheelDeltaY === -3 * event.deltaY : event.deltaMode === 0
        if (Math.abs(event.deltaY) < 5) {
            if (event.deltaX < 0) {
                marginLeft += 25
            } else {
                marginLeft -= 25
            }
        } else {
            if (event.deltaY < 0) {
                if (trackPad) {
                    marginLeft += 25
                } else {
                    marginLeft -= 25
                }
            } else {
                if (trackPad) {
                    marginLeft -= 25
                } else {
                    marginLeft += 25
                }
            }
        }
        if (marginLeft > 0) marginLeft = 0
        if (lastPos) if (marginLeft < lastPos) marginLeft = lastPos
        sliderRef.current.style.marginLeft = `${marginLeft}px`
    }
    
    const handleMouseDown = (event: any) => {
        setDragging(true)
        startX = event.pageX
    }

    const handleMouseMove = (event: any) => {
        if (!dragging) return
        if (!sliderRef.current) return
        let marginLeft = parseInt(sliderRef.current.style.marginLeft)
        if (Number.isNaN(marginLeft)) marginLeft = 0
        if (event.pageX < startX) {
            marginLeft -= 20
        } else if (event.pageX > startX) {
            marginLeft += 20
        }
        if (marginLeft > 0) marginLeft = 0
        if (lastPos) if (marginLeft < lastPos) marginLeft = lastPos
        sliderRef.current.style.marginLeft = `${marginLeft}px`
        startX = event.pageX
    }

    const handleMouseUp = (event: any) => {
        setDragging(false)
    }

    const arrowLeftEnter = () => {
        if (!sliderRef.current) return
        let marginLeft = parseInt(sliderRef.current.style.marginLeft)
        if (Number.isNaN(marginLeft)) marginLeft = 0
        if (marginLeft < 0) setShowLeftArrow(true)
    }

    const arrowRightEnter = () => {
        if (!lastPos) setShowRightArrow(true)
        if (!sliderRef.current) return
        let marginLeft = parseInt(sliderRef.current.style.marginLeft)
        if (Number.isNaN(marginLeft)) marginLeft = 0
        if (marginLeft > lastPos) setShowRightArrow(true)
    }

    const arrowLeftClick = () => {
        if (!showLeftArrow) return
        if (!sliderRef.current) return
        let marginLeft = parseInt(sliderRef.current.style.marginLeft)
        if (Number.isNaN(marginLeft)) marginLeft = 0
        const sidebarWidth = document.querySelector(".sidebar")?.clientWidth || 0
        let newMargin = marginLeft + ((window.innerWidth - sidebarWidth - 120) / 2)
        if (newMargin > 0) newMargin = 0
        sliderRef.current.style.transition = "margin-left 0.75s"
        sliderRef.current.style.marginLeft = `${newMargin}px`
        setTimeout(() => {
            if (!sliderRef.current) return
            sliderRef.current.style.transition = "margin-left 0.05s"
        }, 1000)
    }

    const arrowRightClick = () => {
        if (!showRightArrow) return
        if (!sliderRef.current) return
        let marginLeft = parseInt(sliderRef.current.style.marginLeft)
        if (Number.isNaN(marginLeft)) marginLeft = 0
        const sidebarWidth = document.querySelector(".sidebar")?.clientWidth || 0
        let newMargin = marginLeft - ((window.innerWidth - sidebarWidth - 120) / 2)
        if (lastPos) if (newMargin < lastPos) newMargin = lastPos
        sliderRef.current.style.transition = "margin-left 0.75s"
        sliderRef.current.style.marginLeft = `${newMargin}px`
        setTimeout(() => {
            if (!sliderRef.current) return
            sliderRef.current.style.transition = "margin-left 0.05s"
        }, 1000)
    }

    return (
        <div className="carousel">
            <img className={`carousel-left ${showLeftArrow ? "arrow-visible" : ""}`} src={getArrowLeft()} onMouseEnter={arrowLeftEnter} onMouseLeave={() => setShowLeftArrow(false)} onClick={arrowLeftClick}/>
            <div ref={sliderRef} className="slider" onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp}
            onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                {generateJSX()}
            </div>
            <img className={`carousel-right ${showRightArrow ? "arrow-visible" : ""}`} src={getArrowRight()} onMouseEnter={arrowRightEnter} onMouseLeave={() => setShowRightArrow(false)} onClick={arrowRightClick}/>
        </div>
    )
}

export default Carousel