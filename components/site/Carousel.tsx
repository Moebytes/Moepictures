import React, {useEffect, useRef, useState, useReducer} from "react"
import {useInteractionActions, useThemeSelector, useSessionSelector, useSessionActions, useLayoutSelector, 
useSearchSelector, useFilterSelector} from "../../store"
import functions from "../../structures/Functions"
import arrowLeft from "../../assets/icons/carousel-left.png"
import arrowRight from "../../assets/icons/carousel-right.png"
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
    unverified?: boolean
}

let startX = 0
let deltaCounter = 0
let lastDeltaY = 0
let effectTimer = null as any

const loadAmount = 10
let placeholder = "data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs="

const Carousel: React.FunctionComponent<Props> = (props) => {
    const [ignored, forceUpdate] = useReducer(x => x + 1, 0)
    const {siteHue, siteSaturation, siteLightness} = useThemeSelector()
    const {setEnableDrag} = useInteractionActions()
    const {session} = useSessionSelector()
    const {setSessionFlag} = useSessionActions()
    const {mobile} = useLayoutSelector()
    const {brightness, contrast, hue, saturation, lightness, blur, sharpen, pixelate, splatter} = useFilterSelector()
    const {noteDrawingEnabled} = useSearchSelector()
    const [lastPos, setLastPos] = useState(null as number | null)
    const [dragging, setDragging] = useState(false)
    const [imageRefs, setImageRefs] = useState([] as React.RefObject<HTMLImageElement | HTMLVideoElement>[])
    const [imageFilterRefs, setImageFilterRefs] = useState([] as React.RefObject<HTMLDivElement>[])
    const [pixelateRefs, setPixelateRefs] = useState([] as React.RefObject<HTMLCanvasElement>[])
    const [effectRefs, setEffectRefs] = useState([] as React.RefObject<HTMLCanvasElement>[])
    const [sharpenRefs, setSharpenRefs] = useState([] as React.RefObject<HTMLImageElement>[])
    const [lightnessRefs, setLightnessRefs] = useState([] as React.RefObject<HTMLImageElement>[])
    const [lastActive, setLastActive] = useState(null as React.RefObject<HTMLDivElement> | null)
    const [active, setActive] = useState(null as React.RefObject<HTMLDivElement> | null)
    const [showLeftArrow, setShowLeftArrow] = useState(false)
    const [showRightArrow, setShowRightArrow] = useState(false)
    const [images, setImages] = useState([] as string[])
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

    const updateRefs = (amount: number) => {
        const newImageRefs = Array.from({length: amount}, () => React.createRef<HTMLImageElement | HTMLVideoElement>())
        setImageRefs(newImageRefs)
        const newImageFilterRefs = Array.from({length: amount}, () => React.createRef<HTMLDivElement>())
        setImageFilterRefs(newImageFilterRefs)
        const newPixelateRefs = Array.from({length: amount}, () => React.createRef<HTMLCanvasElement>())
        setPixelateRefs(newPixelateRefs)
        const newEffectRefs = Array.from({length: amount}, () => React.createRef<HTMLCanvasElement>())
        setEffectRefs(newEffectRefs)
        const newSharpenRefs = Array.from({length: amount}, () => React.createRef<HTMLImageElement>())
        setSharpenRefs(newSharpenRefs)
        const newLightnessRefs = Array.from({length: amount}, () => React.createRef<HTMLImageElement>())
        setLightnessRefs(newLightnessRefs)
        return newImageFilterRefs
    }

    const getCombinedImages = () => {
        return functions.removeDuplicates([...props.images, ...(props.appendImages || [])])
    }

    useEffect(() => {
        const newRefs = updateRefs(props.images.slice(0, loadAmount).length)
        setActive(newRefs[props.index ? props.index : 0])
        setLastActive(newRefs[props.index ? props.index : 0])
        setShowLeftArrow(false)
        setShowRightArrow(false)
        setLastPos(null)
        setDragging(false)
        setVisibleImages([])
        setVisibleIndex(0)
        if (sliderRef?.current) {
            sliderRef.current.style.marginLeft = `0px`
        }
    }, [props.images])

    useEffect(() => {
        const startIndex = visibleIndex - loadAmount  > 0 ? visibleIndex - loadAmount : 0
        const decryptImages = async (images: string[]) => {
            const decrypted = await Promise.all(images.map((image) => functions.decryptThumb(image, session)))
            return decrypted
        }
        const newImages = visibleImages.slice(startIndex)
        decryptImages(newImages).then(() => setImages((prev) => [...prev, ...newImages]))
    }, [visibleImages, visibleIndex])
    
    useEffect(() => {
        const images = getCombinedImages()
        let newVisibleImages = [] as string[]
        let currentIndex = 0
        for (let i = 0; i < loadAmount; i++) {
            if (!images[currentIndex]) break
            newVisibleImages.push(images[currentIndex])
            currentIndex++
        }
        setVisibleImages(functions.removeDuplicates(newVisibleImages))
        setVisibleIndex(currentIndex)
        updateRefs(newVisibleImages.length)
    }, [props.images, props.appendImages])

    useEffect(() => {
        if (props.index !== undefined) {
            setActive(imageFilterRefs[props.index])
        }
    }, [props.index])

    useEffect(() => {
        if (updateImagesFlag) {
            const images = getCombinedImages()
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
                updateRefs(newVisibleImages.length)
                setTimeout(() => {
                    setLastPos(null)
                }, 700)
            } else {
                props.update?.()
            }
            setUpdateImagesFlag(false)
        }
    }, [updateImagesFlag, props.images, props.appendImages, visibleImages, visibleIndex, scrollTimeout])

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
        let index = imageFilterRefs.indexOf(active!)
        if (event.key === "ArrowLeft") {
            index-- 
            marginLeft += width
        } else if (event.key === "ArrowRight") {
            index++
            marginLeft -= width
        } 
        if (index < 0) index = 0
        if (index > imageFilterRefs.length - 1) index = imageFilterRefs.length - 1
        if (props.set) props.set(props.images[index], index, false)
        setActive(imageFilterRefs[index])

        if (marginLeft > 0) marginLeft = 0
        if (lastPos) if (marginLeft < lastPos) marginLeft = lastPos
        if (index < 5 || index > imageFilterRefs.length - 6) return
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
        const element = imageFilterRefs[imageFilterRefs.length - 1]?.current
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
    }, [imageFilterRefs])

    useEffect(() => {
        for (let i = 0; i < imageFilterRefs.length; i++) {
            if (imageFilterRefs[i].current?.style) imageFilterRefs[i].current!.style.border = "0"
        }
        if (!active) return
        if (active.current) active.current.style.border = "3px solid var(--text)"
        setLastActive(active)
    }, [active, imageFilterRefs])

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

    useEffect(() => {
        for (let i = 0; i < imageFilterRefs.length; i++) {
            const element = imageFilterRefs[i].current
            const sharpenOverlay = sharpenRefs[i].current
            const lightnessOverlay = lightnessRefs[i].current
            let image = images[i]
            let newContrast = contrast
            if (!element || !image || !sharpenOverlay || !lightnessOverlay) return
            if (sharpen !== 0) {
                const sharpenOpacity = sharpen / 5
                newContrast += 25 * sharpenOpacity
                sharpenOverlay.style.backgroundImage = `url(${image})`
                sharpenOverlay.style.filter = `blur(4px) invert(1) contrast(75%)`
                sharpenOverlay.style.mixBlendMode = "overlay"
                sharpenOverlay.style.opacity = `${sharpenOpacity}`
            } else {
                sharpenOverlay.style.backgroundImage = "none"
                sharpenOverlay.style.filter = "none"
                sharpenOverlay.style.mixBlendMode = "normal"
                sharpenOverlay.style.opacity = "0"
            }
            if (lightness !== 100) {
                const filter = lightness < 100 ? "brightness(0)" : "brightness(0) invert(1)"
                lightnessOverlay.style.filter = filter
                lightnessOverlay.style.opacity = `${Math.abs((lightness - 100) / 100)}`
            } else {
                lightnessOverlay.style.filter = "none"
                lightnessOverlay.style.opacity = "0"
            }
            element.style.filter = `brightness(${brightness}%) contrast(${newContrast}%) hue-rotate(${hue - 180}deg) saturate(${saturation}%) blur(${blur}px)`
        }
    }, [imageFilterRefs, brightness, contrast, hue, saturation, lightness, blur, sharpen])

    const imagePixelate = () => {
        for (let i = 0; i < pixelateRefs.length; i++) {
            const pixelateRef = pixelateRefs[i]
            const imageRef = imageRefs[i]
            if (!pixelateRef.current || !imageRef.current) return
            const pixelateCanvas = pixelateRef.current
            const ctx = pixelateCanvas.getContext("2d")!
            const imageWidth = imageRef.current.clientWidth 
            const imageHeight = imageRef.current.clientHeight
            const landscape = imageWidth >= imageHeight
            ctx.clearRect(0, 0, pixelateCanvas.width, pixelateCanvas.height)
            pixelateCanvas.width = imageWidth
            pixelateCanvas.height = imageHeight
            const pixelWidth = imageWidth / pixelate 
            const pixelHeight = imageHeight / pixelate
            if (pixelate !== 1) {
                ctx.drawImage(imageRef.current, 0, 0, pixelWidth, pixelHeight)
                if (landscape) {
                    pixelateCanvas.style.width = `${imageWidth * pixelate}px`
                    pixelateCanvas.style.height = "auto"
                } else {
                    pixelateCanvas.style.width = "auto"
                    pixelateCanvas.style.height = `${imageHeight * pixelate}px`
                }
                pixelateCanvas.style.opacity = "1"
            } else {
                pixelateCanvas.style.width = "none"
                pixelateCanvas.style.height = "none"
                pixelateCanvas.style.opacity = "0"
            }
        }
    }

    const splatterEffect = () => {
        for (let i = 0; i < effectRefs.length; i++) {
            const effectRef = effectRefs[i]
            const imageRef = imageRefs[i]
            if (!effectRef.current || !imageRef.current) return
            if (splatter !== 0) {
                effectRef.current.style.opacity = "1"
                effectRef.current.width = imageRef.current.width
                effectRef.current.height = imageRef.current.height
                const ctx = effectRef.current.getContext("2d")!

                ctx.drawImage(imageRef.current, 0, 0, effectRef.current.width, effectRef.current.height)
    
                const lineAmount = splatter * 3
                const minOpacity = 0.1
                const maxOpacity = 0.2
                const minLineWidth = 1
                const maxLineWidth = 3
                const minLineLength = 50
                const maxLineLength = 70
                const maxAngle = 180
    
                const lineCount = Math.floor(Math.random() * lineAmount) + lineAmount
                const blendModes = ["lighter"] as GlobalCompositeOperation[]
                for (let i = 0; i < lineCount; i++) {
                    const startX = Math.random() * effectRef.current.width
                    const startY = Math.random() * effectRef.current.height
                    const length = Math.random() * (maxLineLength - minLineLength) + minLineLength
    
                    const radians = (Math.PI / 180) * maxAngle
                    let angle1 = Math.random() * radians - radians / 2
                    let angle2 = Math.random() * radians - radians / 2
    
                    const controlX1 = startX + length * Math.cos(angle1)
                    const controlY1 = startY + length * Math.sin(angle1)
                    const controlX2 = startX + length * Math.cos(angle2)
                    const controlY2 = startY + length * Math.sin(angle2)
                    const endX = startX + length * Math.cos((angle1 + angle2) / 2)
                    const endY = startY + length * Math.sin((angle1 + angle2) / 2)
    
                    const opacity = Math.random() * (maxOpacity - minOpacity) + minOpacity
                    const lineWidth = Math.random() * (maxLineWidth - minLineWidth) + minLineWidth
                    const blendMode = blendModes[Math.floor(Math.random() * blendModes.length)]
    
                    ctx.globalAlpha = opacity
                    ctx.globalCompositeOperation = blendMode
                    ctx.strokeStyle = "#ffffff"
                    ctx.lineWidth = lineWidth
                    ctx.beginPath()
                    ctx.moveTo(startX, startY)
                    ctx.bezierCurveTo(controlX1, controlY1, controlX2, controlY2, endX, endY)
                    ctx.stroke()
                }
                ctx.globalAlpha = 1
                ctx.globalCompositeOperation = "source-over"
            } else {
                effectRef.current.style.opacity = "0"
            }
        }
    }

    useEffect(() => {
        imagePixelate()
    }, [pixelateRefs, pixelate])

    useEffect(() => {
        splatterEffect()
    }, [effectRefs, splatter])

    const generateJSX = () => {
        const jsx = [] as React.ReactElement[]
        let visible = functions.removeDuplicates(images)
        for (let i = 0; i < visible.length; i++) {
            const img = visible[i] as string
            jsx.push(
                <div key={i} className="carousel-img-filters" ref={imageFilterRefs[i]} onClick={(event) => {props.set?.(img, i, event.ctrlKey || event.metaKey || event.button === 1); setActive(imageFilterRefs[i])}} onAuxClick={(event) => {props.set?.(img, i, event.ctrlKey || event.metaKey || event.button === 1); setActive(imageFilterRefs[i])}}>
                    <img draggable={false} ref={lightnessRefs[i]} className="carousel-lightness-overlay" src={img}/>
                    <img draggable={false} ref={sharpenRefs[i]} className="carousel-sharpen-overlay" src={img}/>
                    <canvas draggable={false} ref={effectRefs[i]} className="carousel-effect-canvas"></canvas>
                    <canvas draggable={false} ref={pixelateRefs[i]} className="carousel-pixelate-canvas"></canvas>
                    {functions.isVideo(img) ? 
                    <video draggable={false} autoPlay muted loop disablePictureInPicture ref={imageRefs[i] as any} className="carousel-img" src={img} style={props.height ? {height: `${props.height}px`} : {}}></video> :
                    <img draggable={false} ref={imageRefs[i] as any} className="carousel-img" src={img} style={props.height ? {height: `${props.height}px`} : {}}/>}
                </div>
            )
        }
        return jsx
    }

    let maxWidth = props.marginLeft !== undefined ? `calc(100vw - ${functions.sidebarWidth()}px - 120px - ${props.marginLeft}px)` : `calc(100vw - ${functions.sidebarWidth()}px - 120px)`
    if (mobile) maxWidth = props.marginLeft !== undefined ? `calc(100vw - 10px - ${props.marginLeft}px)` : `calc(100vw - 10px)`
    let marginTop = props.marginTop !== undefined ? `${props.marginTop}px` : ""

    return (
        <div className="carousel" ref={carouselRef} style={{maxWidth, marginTop, overflowX: trackPad ? "auto" : "hidden"}} onScroll={handleScroll}>
            <img className={`carousel-left ${showLeftArrow ? "arrow-visible" : ""}`} src={arrowLeft} style={{filter: getFilter()}} 
            onClick={arrowLeftClick} onMouseEnter={arrowLeftEnter} onMouseLeave={() => setShowLeftArrow(false)}/>
            <div className="slider" ref={sliderRef} onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onTouchStart={handleTouchStart} 
            onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>
                {generateJSX()}
            </div>
            <img className={`carousel-right ${showRightArrow ? "arrow-visible" : ""}`} src={arrowRight} style={{filter: getFilter()}} 
            onMouseEnter={arrowRightEnter} onMouseLeave={() => setShowRightArrow(false)} onClick={arrowRightClick}/>
        </div>
    )
}

export default Carousel