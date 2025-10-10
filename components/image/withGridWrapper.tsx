import React, {useEffect, useRef, useState, forwardRef} from "react"
import {useNavigate, useLocation} from "react-router-dom"
import {useFilterSelector, useInteractionActions, useLayoutSelector, useCacheActions, useThemeSelector, 
useSearchSelector, useSessionSelector, useFlagSelector, useFlagActions, useSearchActions} from "../../store"
import functions from "../../functions/Functions"
import privateIcon from "../../assets/icons/lock-opt.png"
import {PostSearch, GIFFrame} from "../../types/Types"
import "./styles/gridimage.less"

let tooltipTimer = null as any

interface Props {
    id: string
    post: PostSearch
    img: string
    original: string
    live: string
    cached?: boolean
    comicPages?: string[] | null
    square?: boolean
    marginBottom?: number
    marginLeft?: number
    height?: number
    borderRadius?: number
    autoLoad?: boolean
    reupdate?: () => void
    onLoad?: () => void
}

interface Ref {
    shouldWait: () => Promise<boolean>
    load: () => Promise<void>
    update: () => Promise<void>
}

interface AddonProps {
    componentRef: React.ForwardedRef<Ref>
    containerRef: React.RefObject<HTMLDivElement | null>
    imageFiltersRef: React.RefObject<HTMLDivElement | null>
    imageRef: React.RefObject<HTMLImageElement | null>
    animationRef: React.RefObject<HTMLImageElement | null>
    videoRef: React.RefObject<HTMLVideoElement | null>
    audioRef: React.RefObject<HTMLImageElement | null>
    modelRef: React.RefObject<HTMLDivElement | null>
    live2DRef: React.RefObject<HTMLCanvasElement | null>
    lightnessRef: React.RefObject<HTMLImageElement | null>
    overlayRef: React.RefObject<HTMLImageElement | null>
    effectRef: React.RefObject<HTMLCanvasElement | null>
    pixelateRef: React.RefObject<HTMLCanvasElement | null>
    imageLoaded: boolean
    setImageLoaded: React.Dispatch<React.SetStateAction<boolean>>
    hover: boolean
    setHover: React.Dispatch<React.SetStateAction<boolean>>
    imageWidth: number
    setImageWidth: React.Dispatch<React.SetStateAction<number>>
    imageHeight: number
    setImageHeight: React.Dispatch<React.SetStateAction<number>>
    naturalWidth: number
    setNaturalWidth: React.Dispatch<React.SetStateAction<number>>
    naturalHeight: number
    setNaturalHeight: React.Dispatch<React.SetStateAction<number>>
    imageSize: number
    setImageSize: React.Dispatch<React.SetStateAction<number>>
    gifData: GIFFrame[] | null
    setGIFData: React.Dispatch<React.SetStateAction<GIFFrame[] | null>>
    backFrame: string
    setBackFrame: React.Dispatch<React.SetStateAction<string>>
}

export interface GridWrapperRef {
    download: () => Promise<void>
}

export type GridWrapperProps = Props & AddonProps

const withGridWrapper = (WrappedComponent: React.ForwardRefExoticComponent<GridWrapperProps & React.RefAttributes<GridWrapperRef>>) => {
    const GridWrapper = forwardRef<Ref, Props>((props, componentRef) => {
        const {siteHue, siteSaturation, siteLightness} = useThemeSelector()
        const {mobile} = useLayoutSelector()
        const {session} = useSessionSelector()
        const {brightness, contrast, hue, saturation, lightness, blur, sharpen, pixelate, splatter} = useFilterSelector()
        const {sizeType, square, scroll, format, selectionMode, selectionItems, selectionPosts} = useSearchSelector()
        const {setSelectionItems, setSelectionPosts} = useSearchActions()
        const {downloadFlag, downloadIDs} = useFlagSelector()
        const {setPostFlag, setDownloadFlag, setDownloadIDs} = useFlagActions()
        const {setScrollY, setToolTipX, setToolTipY, setToolTipEnabled, setToolTipPost, setToolTipImg} = useInteractionActions()
        const {setPost} = useCacheActions()
        const [visible, setVisible] = useState(true)
        const [drag, setDrag] = useState(false)
        const [pageBuffering, setPageBuffering] = useState(true)
        const [selected, setSelected] = useState(false)
        const navigate = useNavigate()
        const location = useLocation()
        const privateIconRef = useRef<HTMLImageElement>(null)
        const childRef = useRef<GridWrapperRef | null>(null)
        
        /* State passed to children */
        const containerRef = useRef<HTMLDivElement>(null)
        const imageFiltersRef = useRef<HTMLDivElement>(null)
        const imageRef = useRef<HTMLImageElement>(null)
        const animationRef = useRef<HTMLImageElement>(null)
        const videoRef = useRef<HTMLVideoElement>(null)
        const audioRef = useRef<HTMLImageElement>(null)
        const modelRef = useRef<HTMLDivElement>(null)
        const live2DRef = useRef<HTMLCanvasElement>(null)
        const overlayRef = useRef<HTMLImageElement>(null)
        const lightnessRef = useRef<HTMLImageElement>(null)
        const pixelateRef = useRef<HTMLCanvasElement>(null)
        const effectRef = useRef<HTMLCanvasElement>(null)
        const [imageWidth, setImageWidth] = useState(0)
        const [imageHeight, setImageHeight] = useState(0)
        const [naturalWidth, setNaturalWidth] = useState(0)
        const [naturalHeight, setNaturalHeight] = useState(0)
        const [imageLoaded, setImageLoaded] = useState(false)
        const [imageSize, setImageSize] = useState(240)
        const [hover, setHover] = useState(false)
        const [gifData, setGIFData] = useState(null as GIFFrame[] | null)
        const [backFrame, setBackFrame] = useState("")

        const getRef = () => {
            return imageRef.current || animationRef.current || videoRef.current ||
                audioRef.current || modelRef.current || live2DRef.current
        }

        const getFilter = () => {
            return `hue-rotate(${siteHue - 180}deg) saturate(${siteSaturation}%) brightness(${siteLightness + 70}%)`
        }
    
        const handleIntersection = (entries: IntersectionObserverEntry[]) => {
            const entry = entries[0]
            if (entry.intersectionRatio > 0) {
                setVisible(true)
            } else {
                if (scroll) setVisible(false)
            }
        }
    
        useEffect(() => {
            if (typeof window === "undefined") return
            if (!scroll) {
                if (!visible) setVisible(true)
                return
            } else {
                const observer = new IntersectionObserver(handleIntersection, {root: null, rootMargin: "2000px 0px 2000px 0px", threshold: 0.01})
                const element = containerRef.current
                if (element) observer.observe(element)
                return () => {
                    observer.disconnect()
                }
            }
        }, [scroll])
    
        const resizeOverlays = () => {
            const currentRef = getRef()
            if (!currentRef) return
            if (overlayRef.current) {
                overlayRef.current.width = currentRef.clientWidth
                overlayRef.current.height = currentRef.clientHeight
            }
            if (lightnessRef.current) {
                lightnessRef.current.width = currentRef.clientWidth
                lightnessRef.current.height = currentRef.clientHeight
            }
            if (pixelateRef.current) {
                pixelateRef.current.width = currentRef.clientWidth
                pixelateRef.current.height = currentRef.clientHeight
            }
            if (effectRef.current) {
                effectRef.current.width = currentRef.clientWidth
                effectRef.current.height = currentRef.clientHeight
            }
        }
    
        useEffect(() => {
            let observer = null as ResizeObserver | null
            const currentRef = getRef()
            if (currentRef) {
                observer = new ResizeObserver(resizeOverlays)
                observer.observe(currentRef)
            }
            setTimeout(() => {
                setPageBuffering(false)
            }, 500)
            return () => {
                observer?.disconnect()
            }
        }, [])
    
        const getSquareOffset = () => {
            if (mobile) {
                if (sizeType === "tiny") return 20
                if (sizeType === "small") return 25
                if (sizeType === "medium") return 30
                if (sizeType === "large") return 30
                if (sizeType === "massive") return 30
            }
            if (sizeType === "tiny") return 10
            if (sizeType === "small") return 12
            if (sizeType === "medium") return 15
            if (sizeType === "large") return 20
            if (sizeType === "massive") return 30
            return 5
        }
    
        const updateSquare = () => {
            if (!containerRef.current) return
            const currentRef = getRef()
            const refWidth = currentRef?.clientWidth
            const refHeight = currentRef?.clientHeight
            if (!refWidth || !refHeight) return
            if (square || props.square) {
                const sidebarWidth = document.querySelector(".sidebar")?.clientWidth || 0
                const width = window.innerWidth - sidebarWidth
                const containerWidth = Math.floor(width / (mobile ? functions.render.getImagesPerRowMobile(sizeType) : functions.render.getImagesPerRow(sizeType))) - getSquareOffset()
                containerRef.current.style.width = props.height ? `${props.height}px` : `${containerWidth}px`
                containerRef.current.style.height = props.height ? `${props.height}px` : `${containerWidth}px`
                containerRef.current.style.marginBottom = props.marginBottom ? `${props.marginBottom}px` : "3px"
                containerRef.current.style.marginLeft = props.marginLeft ? `${props.marginLeft}px` : "0px"
                const landscape = refWidth <= refHeight
                if (landscape) {
                    currentRef.style.width = props.height ? `${props.height}px` : `${containerWidth}px`
                    currentRef.style.height = "auto"
                } else {
                    currentRef.style.width = "auto"
                    currentRef.style.height = props.height ? `${props.height}px` : `${containerWidth}px`
                }
            } else {
                containerRef.current.style.width = "max-content"
                containerRef.current.style.height = "max-content"
                currentRef.style.width = "auto"
                currentRef.style.height = props.height ? `${props.height}px` : `${imageSize}px`
                containerRef.current.style.marginBottom = props.marginBottom ? `${props.marginBottom}px` : "10px"
                containerRef.current.style.marginLeft = props.marginLeft ? `${props.marginLeft}px` : "0px"
            }
        }
    
        useEffect(() => {
            updateSquare()
        }, [square, sizeType, imageSize, imageWidth, imageHeight])
    
        useEffect(() => {
            if (!containerRef.current) return
            containerRef.current.style.boxShadow = getBorder()
        }, [imageLoaded, sizeType, selected, session, props.post])
    
        useEffect(() => {
            if (mobile) {
                if (sizeType === "tiny") {
                    setImageSize(100)
                } else if (sizeType === "small") {
                    setImageSize(150)
                } else if (sizeType === "medium") {
                    setImageSize(230)
                } else if (sizeType === "large") {
                    setImageSize(350)
                } else if (sizeType === "massive") {
                    setImageSize(510)
                }
            } else {
                if (sizeType === "tiny") {
                    setImageSize(160)
                } else if (sizeType === "small") {
                    setImageSize(200)
                } else if (sizeType === "medium") {
                    setImageSize(270)
                } else if (sizeType === "large") {
                    setImageSize(400)
                } else if (sizeType === "massive") {
                    setImageSize(500)
                }
            }
        }, [sizeType])
    
        useEffect(() => {
            if (!imageFiltersRef.current) return
            const element = imageFiltersRef.current
            let newContrast = contrast
            let image = props.img
            if (backFrame) image = backFrame
            const sharpenOverlay = overlayRef.current
            const lightnessOverlay = lightnessRef.current
            if (!image || !sharpenOverlay || !lightnessOverlay) return
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
        }, [brightness, contrast, hue, saturation, lightness, blur, sharpen])
    
        useEffect(() => {
            setTimeout(() => {
                let drawableRef = imageRef.current || animationRef.current
                functions.image.pixelateEffect(pixelateRef.current, drawableRef, pixelate, 
                {isAnimation: Number(gifData?.length) > 0, isVideo: Boolean(videoRef.current)})
                functions.image.splatterEffect(effectRef.current, drawableRef, splatter, {lineMultiplier: 4, 
                maxLineWidth: 3, isAnimation: Number(gifData?.length) > 0, isVideo: Boolean(videoRef.current)})
            }, 50)
        }, [imageLoaded, hover])
    
        useEffect(() => {
            let drawableRef = imageRef.current || animationRef.current
            functions.image.pixelateEffect(pixelateRef.current, drawableRef, pixelate, 
            {isAnimation: Number(gifData?.length) > 0, isVideo: Boolean(videoRef.current)})
        }, [pixelate, square, imageSize])
    
        useEffect(() => {
            let drawableRef = imageRef.current || animationRef.current
            functions.image.splatterEffect(effectRef.current, drawableRef, splatter, {lineMultiplier: 4, 
            maxLineWidth: 3, isAnimation: Number(gifData?.length) > 0, isVideo: Boolean(videoRef.current)})
        }, [splatter])
    
        const imageAnimation = (event: React.MouseEvent<HTMLDivElement>) => {
            if (!overlayRef.current || !pixelateRef.current || !lightnessRef.current || !effectRef.current) return
            const currentRef = getRef()
            if (!currentRef) return
            const rect = currentRef.getBoundingClientRect()
            const width = rect?.width
            const height = rect?.height
            const x = event.clientX - rect.x
            const y = event.clientY - rect.y
            const translateX = ((x / width) - 0.5) * 3
            const translateY = ((y / height) - 0.5) * 3
            currentRef.style.transform = `translateX(${translateX}px) translateY(${translateY}px) scale(1.02)`
            overlayRef.current.style.transform = `translateX(${translateX}px) translateY(${translateY}px) scale(1.02)`
            lightnessRef.current.style.transform = `translateX(${translateX}px) translateY(${translateY}px) scale(1.02)`
            pixelateRef.current.style.transformOrigin = "top left"
            pixelateRef.current.style.transform = `translateX(${translateX}px) translateY(${translateY}px) scale(1.02)`
            effectRef.current.style.transformOrigin = "top left"
            effectRef.current.style.transform = `translateX(${translateX}px) translateY(${translateY}px) scale(1.02)`
        }
    
        const cancelImageAnimation = () => {
            if (!overlayRef.current || !pixelateRef.current || !lightnessRef.current || !effectRef.current) return
            const currentRef = getRef()
            if (!currentRef) return
            currentRef.style.transform = "scale(1)"
            overlayRef.current.style.transform = "scale(1)"
            lightnessRef.current.style.transform = "scale(1)"
            pixelateRef.current.style.transformOrigin = "none"
            pixelateRef.current.style.transform = "scale(1)"
            effectRef.current.style.transformOrigin = "none"
            effectRef.current.style.transform = "scale(1)"
        }
    
        useEffect(() => {
            if (downloadFlag) {
                if (downloadIDs.includes(props.post.postID)) {
                    childRef.current?.download()
                    setDownloadIDs(downloadIDs.filter((s: string) => s !== props.post.postID))
                    setDownloadFlag(false)
                }
            }
        }, [downloadFlag, session, format])
    
        const onClick = (event: React.MouseEvent<HTMLElement>) => {
            if (event.metaKey || event.ctrlKey || event.button === 1) {
                if (!location.pathname.includes("/post/")) setPost(null)
                event.preventDefault()
                const newWindow = window.open(`/post/${props.id}/${props.post.slug}`, "_blank")
                newWindow?.blur()
                window.focus()
            }
        }
    
        const mouseDown = () => {
            setDrag(false)
        }
    
        const mouseMove = () => {
            setDrag(true)
        }
    
        const mouseUp = async (event: React.MouseEvent<HTMLElement>) => {
            setScrollY(window.scrollY)
            if (selectionMode) {
                if (event.metaKey || event.ctrlKey || event.button == 1 || event.button == 2) {
                    return
                } else {
                    const isSelected = !selected
                    if (isSelected) {
                        selectionItems.add(props.post.postID)
                        selectionPosts.set(props.post.postID, props.post)
                    } else {
                        selectionItems.delete(props.post.postID)
                        selectionPosts.delete(props.post.postID)
                    }
                    setSelected(isSelected)
                    setSelectionItems(selectionItems)
                    setSelectionPosts(selectionPosts)
                }
            } else {
                if (!drag) {
                    if (event.metaKey || event.ctrlKey || event.button == 1 || event.button == 2) {
                        return
                    } else {
                        if (location.pathname.includes("/post/")) {
                            navigate(`/post/${props.id}/${props.post.slug}`, {replace: true})
                            setPostFlag(props.id)
                            window.scrollTo(0, 0)
                        } else {
                            setPost(null)
                            navigate(`/post/${props.id}/${props.post.slug}`)
                            window.scrollTo(0, 0)
                        }
                    }
                }
            }
        }
    
        const mouseEnter = () => {
            setHover(true)
            if (pageBuffering) return
            tooltipTimer = setTimeout(() => {
                if (!containerRef.current) return
                const rect = containerRef.current.getBoundingClientRect()
                const toolTipWidth = 325
                const toolTipHeight = 175
                const midpoint = (rect.left + rect.right) / 2
                setToolTipX(Math.floor(midpoint - (toolTipWidth / 2)))
                setToolTipY(Math.floor(rect.y - (toolTipHeight / 1.05)))
                setToolTipPost(props.post)
                setToolTipImg(props.img)
                setToolTipEnabled(true)
            }, 700)
        }
    
        const mouseLeave = () => {
            setHover(false)
            if (pageBuffering) return
            if (tooltipTimer) clearTimeout(tooltipTimer)
            setToolTipEnabled(false)
        }
    
        const getBorder = () => {
            if (sizeType === "tiny" || sizeType === "small" || session.captchaNeeded) {
                if (selected) {
                    return "0px 0px 0px 2px var(--selectBorder)"
                } else {
                    return `0px 0px 0px 1px ${functions.post.borderColor(props.post)}`
                }
            } else {
                if (selected) {
                    return "0px 0px 0px 4px var(--selectBorder)"
                } else {
                    return `0px 0px 0px 2px ${functions.post.borderColor(props.post)}`
                }
            }
        }
    
        useEffect(() => {
            if (!selectionMode) {
                setSelected(false)
                selectionItems.delete(props.post.postID)
                selectionPosts.delete(props.post.postID)
            }
        }, [selectionMode])
        
        const refWidth = getRef()?.clientWidth
    
        return (
            <div style={{opacity: visible && refWidth ? "1" : "0", transition: "opacity 0.1s", borderRadius: `${props.borderRadius || 0}px`}} className="image-box" id={String(props.id)} ref={containerRef} 
            onClick={onClick} onAuxClick={onClick} onMouseDown={mouseDown} onMouseUp={mouseUp} onMouseMove={mouseMove} onMouseEnter={mouseEnter} onMouseLeave={mouseLeave}>
                <div className="image-filters" ref={imageFiltersRef} onMouseMove={(event) => imageAnimation(event)} onMouseLeave={() => cancelImageAnimation()}>
                    {props.post.private ? <img style={{opacity: hover ? "1" : "0", transition: "opacity 0.3s", filter: getFilter()}} className="song-icon" src={privateIcon} 
                    ref={privateIconRef} onMouseDown={(event) => {event.stopPropagation()}} onMouseUp={(event) => {event.stopPropagation()}}/> : null}
    
                    <WrappedComponent 
                        {...props}
                        ref={childRef}
                        componentRef={componentRef}
                        containerRef={containerRef}
                        imageFiltersRef={imageFiltersRef}
                        imageRef={imageRef}
                        animationRef={animationRef}
                        videoRef={videoRef}
                        audioRef={audioRef}
                        modelRef={modelRef}
                        live2DRef={live2DRef}
                        lightnessRef={lightnessRef}
                        overlayRef={overlayRef}
                        effectRef={effectRef}
                        pixelateRef={pixelateRef}
                        hover={hover}
                        setHover={setHover}
                        imageLoaded={imageLoaded}
                        setImageLoaded={setImageLoaded}
                        imageWidth={imageWidth}
                        setImageWidth={setImageWidth}
                        imageHeight={imageHeight}
                        setImageHeight={setImageHeight}
                        naturalWidth={naturalWidth}
                        setNaturalWidth={setNaturalWidth}
                        naturalHeight={naturalHeight}
                        setNaturalHeight={setNaturalHeight}
                        imageSize={imageSize}
                        setImageSize={setImageSize}
                        gifData={gifData}
                        setGIFData={setGIFData}
                        backFrame={backFrame}
                        setBackFrame={setBackFrame}
                    />
                </div>
            </div>
        )
    })

    return GridWrapper
}

export default withGridWrapper