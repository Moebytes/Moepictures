import React, {useEffect, useRef, useState, useReducer} from "react"
import {useInteractionActions, useThemeSelector, useSessionSelector, useSessionActions, useLayoutSelector, 
useSearchSelector, useFilterSelector, useFlagSelector, useCacheActions} from "../../store"
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

const loadAmount = 25

const Carousel: React.FunctionComponent<Props> = (props) => {
    const [ignored, forceUpdate] = useReducer(x => x + 1, 0)
    const {siteHue, siteSaturation, siteLightness} = useThemeSelector()
    const {setEnableDrag} = useInteractionActions()
    const {session} = useSessionSelector()
    const {setSessionFlag} = useSessionActions()
    const {mobile} = useLayoutSelector()
    const {brightness, contrast, hue, saturation, lightness, blur, sharpen, pixelate, splatter} = useFilterSelector()
    const {noteDrawingEnabled} = useSearchSelector()
    const {setPost} = useCacheActions()
    const [lastPos, setLastPos] = useState(null as number | null)
    const [dragging, setDragging] = useState(false)
    const [imageRefs, setImageRefs] = useState([] as React.RefObject<HTMLImageElement | HTMLVideoElement | null>[])
    const [imageFilterRefs, setImageFilterRefs] = useState([] as React.RefObject<HTMLDivElement | null>[])
    const [pixelateRefs, setPixelateRefs] = useState([] as React.RefObject<HTMLCanvasElement | null>[])
    const [effectRefs, setEffectRefs] = useState([] as React.RefObject<HTMLCanvasElement | null>[])
    const [sharpenRefs, setSharpenRefs] = useState([] as React.RefObject<HTMLImageElement | null>[])
    const [lightnessRefs, setLightnessRefs] = useState([] as React.RefObject<HTMLImageElement | null>[])
    const [lastActive, setLastActive] = useState(null as React.RefObject<HTMLDivElement | null> | null)
    const [active, setActive] = useState(null as React.RefObject<HTMLDivElement | null> | null)
    const [showLeftArrow, setShowLeftArrow] = useState(false)
    const [showRightArrow, setShowRightArrow] = useState(false)
    const [images, setImages] = useState([] as string[])
    const [visibleImages, setVisibleImages] = useState([] as string[])
    const [visibleIndex, setVisibleIndex] = useState(0)
    const [updateImagesFlag, setUpdateImagesFlag] = useState(false)
    const [ended, setEnded] = useState(false)
    const [scrollTimeout, setScrollTimeout] = useState(false)
    const [trackPad, setTrackPad] = useState(false)
    const [lastResetFlag, setLastResetFlag] = useState(null)
    const carouselRef = useRef<HTMLDivElement | null>(null)
    const sliderRef = useRef<HTMLDivElement | null>(null)

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
        setEnded(false)
        if (sliderRef?.current) {
            sliderRef.current.style.marginLeft = `0px`
        }
    }, [props.images])

    useEffect(() => {
        const decryptImages = async () => {
            const startIndex = visibleIndex - loadAmount  > 0 ? visibleIndex - loadAmount : 0
            const newImages = visibleImages.slice(startIndex)
            let decrypted = await Promise.all(newImages.map((image) => functions.decryptThumb(image, session, `carousel-${image}`)))
            if (startIndex === 0) {
                setImages(decrypted)
            } else {
                setImages((prev) => [...prev, ...decrypted])
            }
        }
        decryptImages()
    }, [visibleImages, visibleIndex, session])
    
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
    }, [props.images, props.appendImages, visibleIndex])

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
                setEnded(true)
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
                        if (ended) setLastPos(margin)
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
        setFunc(props.images[index], index, false, imageFilterRefs[index])

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
    })

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
        let step = 25
        if (trackPadScroll) {
            //sliderRef.current.style.marginLeft = `0px`
            //return setTrackPad(true)
            step = 15
        }
        setTrackPad(false)
        if (Math.abs(event.deltaY) < 5) {
            if (event.deltaX < 0) {
                marginLeft += step
            } else {
                marginLeft -= step
            }
        } else {
            if (event.deltaY < 0) {
                marginLeft -= step
            } else {
                marginLeft += step
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

    useEffect(() => {
        for (let i = 0; i < pixelateRefs.length; i++) {
            const pixelateRef = pixelateRefs[i]
            const imageRef = imageRefs[i]
            functions.pixelateEffect(pixelateRef.current, imageRef.current, pixelate)
        }
    }, [pixelateRefs, pixelate])

    useEffect(() => {
        for (let i = 0; i < effectRefs.length; i++) {
            const effectRef = effectRefs[i]
            const imageRef = imageRefs[i]
            functions.splatterEffect(effectRef.current, imageRef.current, splatter, {lineMultiplier: 3, maxLineWidth: 3})
        }
    }, [effectRefs, splatter])

    const setFunc = (image: string, index: number, newTab: boolean, ref: React.RefObject<HTMLDivElement | null>) => {
        setActive(ref)
        props.set?.(image, index, newTab)
    }

    const generateJSX = () => {
        const jsx = [] as React.ReactElement[]
        let visible = functions.removeDuplicates(images)
        for (let i = 0; i < visible.length; i++) {
            const img = visible[i] as string
            const set = (event: React.MouseEvent) => {
                setFunc(img, i, event.ctrlKey || event.metaKey || event.button === 1, imageFilterRefs[i])
            }
            jsx.push(
                <div key={i} className="carousel-img-filters" ref={imageFilterRefs[i]} onClick={set} onAuxClick={set}>
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