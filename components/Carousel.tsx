import React, {useEffect, useRef, useState, useReducer} from "react"
import {useInteractionActions, useThemeSelector, useSessionSelector, useSessionActions, useLayoutSelector, 
useSearchSelector, useFilterSelector} from "../store"
import functions from "../structures/Functions"
import arrowLeft from "../assets/icons/carousel-left.png"
import arrowRight from "../assets/icons/carousel-right.png"
import "./styles/carousel.less"

interface Props {
    set?: (img: string, index: number, newTab: boolean) => void
    noKey?: boolean
    images: string[]
    height?: number
    index?: number
    update?: () => void
    appendImages?: string[]
    marginLeft?: number
    marginTop?: number
}

let startX = 0
let deltaCounter = 0
let lastDeltaY = 0
let effectTimer = null as any

const loadAmount = 10

const Carousel: React.FunctionComponent<Props> = (props) => {
    const [ignored, forceUpdate] = useReducer(x => x + 1, 0)
    const {siteHue, siteSaturation, siteLightness} = useThemeSelector()
    const {setEnableDrag} = useInteractionActions()
    const {session} = useSessionSelector()
    const {setSessionFlag} = useSessionActions()
    const {mobile} = useLayoutSelector()
    const {brightness, contrast, hue, saturation, lightness, blur, sharpen, pixelate} = useFilterSelector()
    const {noteDrawingEnabled} = useSearchSelector()
    const [lastPos, setLastPos] = useState(null as number | null)
    const [dragging, setDragging] = useState(false)
    const [imagesRef, setImagesRef] = useState([] as React.RefObject<HTMLCanvasElement | HTMLVideoElement>[])
    const [lastActive, setLastActive] = useState(null as React.RefObject<HTMLCanvasElement | HTMLVideoElement> | null)
    const [active, setActive] = useState(null as React.RefObject<HTMLCanvasElement | HTMLVideoElement> | null)
    const [showLeftArrow, setShowLeftArrow] = useState(false)
    const [showRightArrow, setShowRightArrow] = useState(false)
    const [images, setImages] = useState(props.images)
    const [visibleImages, setVisibleImages] = useState([] as string[])
    const [visibleIndex, setVisibleIndex] = useState(0)
    const [updateImagesFlag, setUpdateImagesFlag] = useState(false)
    const [scrollTimeout, setScrollTimeout] = useState(false)
    const [trackPad, setTrackPad] = useState(false)
    const [lastResetFlag, setLastResetFlag] = useState(null)
    const carouselRef = useRef<HTMLDivElement>(null)
    const sliderRef = useRef<HTMLDivElement>(null)

    const getFilter = () => {
        return `hue-rotate(${siteHue - 180}deg) saturate(${siteSaturation}%) brightness(${siteLightness + 70}%)`
    }

    useEffect(() => {
        const newImagesRef = props.images.slice(0, loadAmount).map(() => React.createRef<HTMLCanvasElement | HTMLVideoElement>())
        setActive(newImagesRef[props.index ? props.index : 0])
        setLastActive(newImagesRef[props.index ? props.index : 0])
        setShowLeftArrow(false)
        setShowRightArrow(false)
        setLastPos(null)
        setDragging(false)
        setImagesRef(newImagesRef)
        setVisibleImages([])
        setVisibleIndex(0)
        setImages(props.images)
        if (sliderRef?.current) {
            sliderRef.current.style.marginLeft = `0px`
        }
        const base64Images = async () => {
            const base64Images = await Promise.all(props.images.map((image) => functions.linkToBase64(image)))
            setImages(base64Images)
        }
        // base64Images()
    }, [props.images])

    useEffect(() => {
        if (props.index !== undefined) {
            setActive(imagesRef[props.index])
        }
    }, [props.index])
    
    useEffect(() => {
        let newVisibleImages = [] as string[]
        let currentIndex = 0
        for (let i = 0; i < loadAmount; i++) {
            if (!props.images[currentIndex]) break
            newVisibleImages.push(props.images[currentIndex])
            currentIndex++
        }
        setVisibleImages(functions.removeDuplicates(newVisibleImages))
        setVisibleIndex(currentIndex)
        const newImagesRef = newVisibleImages.map(() => React.createRef<HTMLCanvasElement | HTMLVideoElement>())
        setImagesRef(newImagesRef)
    }, [props.images])

    useEffect(() => {
        if (props.appendImages) {
            const newImages = [...images, ...props.appendImages]
            setImages(functions.removeDuplicates(newImages))
        }
    }, [props.appendImages])

    useEffect(() => {
        if (updateImagesFlag) {
            if (scrollTimeout) return setUpdateImagesFlag(false)
            setScrollTimeout(true)
            setTimeout(() => {
                setScrollTimeout(false)
            }, 1000)
            if (visibleImages.length < images.length) {
                let newVisibleImages = visibleImages
                let currentIndex = visibleIndex
                for (let i = 0; i < loadAmount; i++) {
                    if (!images[currentIndex]) break
                    newVisibleImages.push(images[currentIndex])
                    currentIndex++
                }
                setVisibleImages(newVisibleImages)
                setVisibleIndex(currentIndex)
                const newImagesRef = newVisibleImages.map(() => React.createRef<HTMLCanvasElement | HTMLVideoElement>())
                setImagesRef(newImagesRef)
                setTimeout(() => {
                    setLastPos(null)
                }, 700)
            } else {
                props.update?.()
            }
            setUpdateImagesFlag(false)
        }
    }, [updateImagesFlag, images, visibleImages, visibleIndex, scrollTimeout])

    const handleIntersection = (entries: IntersectionObserverEntry[]) => {
        for (let entry of entries) {
            if (entry.intersectionRatio === 1) {
                if (!sliderRef?.current) return
                const margin = parseInt(sliderRef.current.style.marginLeft)
                if (margin < 0) {
                    if (!scrollTimeout) {
                        setLastPos(margin)
                        setUpdateImagesFlag(true)
                    }
                }
            }
        }
    }
    let entriesSeen = new Set()
    const handleResize = (entries: ResizeObserverEntry[]) => {
        for (let entry of entries) {
            if (!entriesSeen.has(entry.target)) {
                entriesSeen.add(entry.target)
            } else {
                setLastPos(null)
            }
        }
    }

    const handleKeydown = (event: KeyboardEvent) => {
        if (props.noKey) return
        if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return
        if (!sliderRef?.current) return
        if ((event.target instanceof HTMLTextAreaElement) || (event.target instanceof HTMLInputElement) 
        || (event.target instanceof HTMLElement && event.target.classList.contains("dialog-textarea"))) return
        if (noteDrawingEnabled) return
        let marginLeft = parseInt(sliderRef.current.style.marginLeft)
        if (Number.isNaN(marginLeft)) marginLeft = 0
        const width = document.querySelector(".carousel-img")?.clientWidth || 0
        let index = imagesRef.indexOf(active!)
        if (event.key === "ArrowLeft") {
            index-- 
            marginLeft += width
        } else if (event.key === "ArrowRight") {
            index++
            marginLeft -= width
        } 
        if (index < 0) index = 0
        if (index > imagesRef.length - 1) index = imagesRef.length - 1
        if (props.set) props.set(props.images[index], index, false)
        setActive(imagesRef[index])

        if (marginLeft > 0) marginLeft = 0
        if (lastPos) if (marginLeft < lastPos) marginLeft = lastPos
        if (index < 5 || index > imagesRef.length - 6) return
        sliderRef.current.style.transition = "margin-left 0.75s"
        sliderRef.current.style.marginLeft = `${marginLeft}px`
        setTimeout(() => {
            if (!sliderRef?.current) return
            sliderRef.current.style.transition = "margin-left 0.05s"
        }, 1000)
    }

    useEffect(() => {
        if (typeof window === "undefined") return
        window.addEventListener("keydown", handleKeydown)
        if (sliderRef.current) sliderRef.current.addEventListener("wheel", handleWheel, {passive: false})
        const observer = new IntersectionObserver(handleIntersection, {root: null, rootMargin: "20px", threshold: 1})
        const resizeObserver = new ResizeObserver(handleResize)
        const element = imagesRef[imagesRef.length - 1]?.current
        if (element) {
            observer.observe(element)
            resizeObserver.observe(element)
        }
        return () => {
            window.removeEventListener("keydown", handleKeydown)
            if (sliderRef.current) sliderRef.current.removeEventListener("wheel", handleWheel)
            observer.disconnect()
            resizeObserver.disconnect()
        }
    })

    useEffect(() => {
        for (let i = 0; i < imagesRef.length; i++) {
            if (imagesRef[i].current?.style) imagesRef[i].current!.style.border = "0"
        }
        if (!active) return
        if (active.current) active.current.style.border = "3px solid var(--text)"
        setLastActive(active)
    }, [active, imagesRef])

    const handleWheel = (event: WheelEvent) => {
        if (!sliderRef.current) return
        if (props.images.length <= 3) return
        if (!trackPad) event.preventDefault()
        let marginLeft = parseInt(sliderRef.current.style.marginLeft)
        if (Number.isNaN(marginLeft)) marginLeft = 0
        let trackPadScroll = false
        if (deltaCounter < 15) trackPadScroll = true
        const skipDelta = Math.abs(event.deltaY) === lastDeltaY*2
        if (Math.abs(event.deltaY) === lastDeltaY || skipDelta) {
            deltaCounter += 1
        } else {
            deltaCounter = 0
        }
        if (Math.abs(event.deltaY) > 0 && !skipDelta) lastDeltaY = Math.abs(event.deltaY)
        if (trackPadScroll) {
            sliderRef.current.style.marginLeft = `0px`
            return setTrackPad(true)
        }
        setTrackPad(false)
        if (Math.abs(event.deltaY) < 5) {
            if (event.deltaX < 0) {
                marginLeft += 25
            } else {
                marginLeft -= 25
            }
        } else {
            if (event.deltaY < 0) {
                marginLeft -= 25
            } else {
                marginLeft += 25
            }
        }
        if (marginLeft > 0) marginLeft = 0
        if (lastPos) if (marginLeft < lastPos) marginLeft = lastPos
        sliderRef.current.style.marginLeft = `${marginLeft}px`
    }

    const handleScroll = () => {
        if (!trackPad) return
        if (!carouselRef.current) return
        if (carouselRef.current.scrollLeft + carouselRef.current.clientWidth >= carouselRef.current.scrollWidth) {
            setUpdateImagesFlag(true)
        }
    }
    
    const handleMouseDown = (event: React.MouseEvent) => {
        setDragging(true)
        startX = event.pageX
    }

    const handleMouseMove = (event: React.MouseEvent) => {
        if (!sliderRef.current) return
        if (props.images.length <= 3) return
        if (!dragging) return
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

    const handleMouseUp = (event: React.MouseEvent) => {
        setDragging(false)
    }

    useEffect(() => {
        const winMouseUp = () => setDragging(false)
        window.addEventListener("mouseup", winMouseUp)
        return () => window.removeEventListener("mouseup", winMouseUp)
    }, [])

    const handleTouchStart = (event: React.TouchEvent) => {
        if (!event.touches.length) return
        setDragging(true)
        startX = event.touches[0].pageX
    }

    const handleTouchMove = (event: React.TouchEvent) => {
        if (!sliderRef.current) return
        if (props.images.length <= 3) return
        if (!event.touches.length) return
        if (!dragging) return
        let marginLeft = parseInt(sliderRef.current.style.marginLeft)
        if (Number.isNaN(marginLeft)) marginLeft = 0
        if (event.touches[0].pageX < startX) {
            marginLeft -= 10
        } else if (event.touches[0].pageX > startX) {
            marginLeft += 10
        }
        if (marginLeft > 0) marginLeft = 0
        if (lastPos) if (marginLeft < lastPos) marginLeft = lastPos
        sliderRef.current.style.marginLeft = `${marginLeft}px`
        startX = event.touches[0].pageX
    }

    const handleTouchEnd = (event: React.TouchEvent) => {
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
        if (lastPos && marginLeft > lastPos) setShowRightArrow(true)
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

    const filtersOn = () => {
        if ((brightness !== 100) ||
            (contrast !== 100) ||
            (hue !== 180) ||
            (saturation !== 100) ||
            (lightness !== 100) ||
            (blur !== 0) ||
            (sharpen !== 0) ||
            (pixelate !== 1)) {
                return true 
            } else {
                return false
            }
    }

    const loadImages = async () => {
        if (!imagesRef?.length) return
        if (filtersOn() && effectTimer) return
        effectTimer = setTimeout(() => {
            effectTimer = null
            forceUpdate()
        }, 500)
        const startIndex = visibleIndex - loadAmount  > 0 ? visibleIndex - loadAmount : 0
        for (let i = startIndex; i < imagesRef.length; i++) {
            const ref = imagesRef[i]
            if (!ref.current) continue
            let src = visibleImages[i] 
            if (functions.isVideo(src)) continue
            src = await functions.decryptThumb(visibleImages[i], session)
            const imgElement = document.createElement("img")
            imgElement.src = src
            imgElement.onload = () => {
                if (!ref.current || !(ref.current instanceof HTMLCanvasElement)) return
                const rendered = functions.render(imgElement, brightness, contrast, hue, saturation, lightness, blur, sharpen, pixelate)
                const refCtx = ref.current.getContext("2d")
                ref.current.width = rendered.width
                ref.current.height = rendered.height
                refCtx?.drawImage(rendered, 0, 0, rendered.width, rendered.height)
            }
        }
    }

    useEffect(() => {
        loadImages()
    }, [visibleImages, visibleIndex, imagesRef, brightness, contrast, hue, saturation, lightness, blur, sharpen, pixelate, session])

    const generateJSX = () => {
        const jsx = [] as React.ReactElement[]
        let visible = functions.removeDuplicates(visibleImages)
        for (let i = 0; i < visible.length; i++) {
            const img = visible[i] as string
            if (functions.isVideo(img)) {
                jsx.push(<video key={i} autoPlay muted loop disablePictureInPicture ref={imagesRef[i] as any} className="carousel-img" src={img} onClick={(event) => {props.set?.(img, i, event.ctrlKey || event.metaKey || event.button === 1); setActive(imagesRef[i])}} onAuxClick={(event) => {props.set?.(img, i, event.ctrlKey || event.metaKey || event.button === 1); setActive(imagesRef[i])}} style={props.height ? {height: `${props.height}px`} : {}}></video>)
            } else {
                jsx.push(<canvas key={i} ref={imagesRef[i] as any} className="carousel-img" onClick={(event) => {props.set?.(img, i, event.ctrlKey || event.metaKey || event.button === 1); setActive(imagesRef[i])}} onAuxClick={(event) => {props.set?.(img, i, event.ctrlKey || event.metaKey || event.button === 1); setActive(imagesRef[i])}} style={props.height ? {height: `${props.height}px`} : {}}></canvas>)
            }
        }
        return jsx
    }

    let maxWidth = props.marginLeft !== undefined ? `calc(100vw - ${functions.sidebarWidth()}px - 120px - ${props.marginLeft}px)` : `calc(100vw - ${functions.sidebarWidth()}px - 120px)`
    if (mobile) maxWidth = props.marginLeft !== undefined ? `calc(100vw - 10px - ${props.marginLeft}px)` : `calc(100vw - 10px)`
    let marginTop = props.marginTop !== undefined ? `${props.marginTop}px` : ""

    return (
        <div className="carousel" ref={carouselRef} style={{maxWidth, marginTop, overflowX: trackPad ? "auto" : "hidden"}} onScroll={handleScroll}>
            <img className={`carousel-left ${showLeftArrow ? "arrow-visible" : ""}`} src={arrowLeft} style={{filter: getFilter()}} onMouseEnter={arrowLeftEnter} onMouseLeave={() => setShowLeftArrow(false)} onClick={arrowLeftClick}/>
            <div className="slider" ref={sliderRef} onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>
                {generateJSX()}
            </div>
            <img className={`carousel-right ${showRightArrow ? "arrow-visible" : ""}`} src={arrowRight} style={{filter: getFilter()}} onMouseEnter={arrowRightEnter} onMouseLeave={() => setShowRightArrow(false)} onClick={arrowRightClick}/>
        </div>
    )
}

export default Carousel