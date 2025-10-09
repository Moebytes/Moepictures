import React, {useEffect, useRef, useState, forwardRef, useImperativeHandle, SyntheticEvent} from "react"
import {useNavigate, useLocation} from "react-router-dom"
import loading from "../../assets/icons/loading.gif"
import {useFilterSelector, useInteractionActions, useLayoutSelector, usePlaybackActions, useSearchActions, useCacheActions,
useThemeSelector, useSearchSelector, useSessionSelector, useFlagSelector, useFlagActions} from "../../store"
import path from "path"
import functions from "../../functions/Functions"
import "./styles/gridimage.less"
import musicNote from "../../assets/icons/music-note.png"
import privateIcon from "../../assets/icons/lock-opt.png"
import {PostSearch} from "../../types/Types"

let tooltipTimer = null as any

interface Props {
    id: string
    img: string
    audio: string
    cached?: boolean
    post: PostSearch
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
}

const GridSong = forwardRef<Ref, Props>((props, componentRef) => {
    const {siteHue, siteSaturation, siteLightness} = useThemeSelector()
    const {mobile} = useLayoutSelector()
    const {session} = useSessionSelector()
    const {brightness, contrast, hue, saturation, lightness, blur, sharpen, pixelate} = useFilterSelector()
    const {setAudio, setAudioPost, setPlayFlag, setAudioSecondsProgress, setAudioReverse, setAudioSeekTo} = usePlaybackActions()
    const {sizeType, square, scroll, selectionMode, selectionItems, selectionPosts} = useSearchSelector()
    const {setSelectionItems, setSelectionPosts} = useSearchActions()
    const {downloadFlag, downloadIDs} = useFlagSelector()
    const {setPostFlag, setDownloadFlag, setDownloadIDs} = useFlagActions()
    const {setScrollY, setToolTipX, setToolTipY, setToolTipEnabled, setToolTipPost, setToolTipImg} = useInteractionActions()
    const {setPost} = useCacheActions()
    const [imageSize, setImageSize] = useState(240)
    const containerRef = useRef<HTMLDivElement>(null)
    const pixelateRef = useRef<HTMLCanvasElement>(null)
    const overlayRef = useRef<HTMLImageElement>(null)
    const lightnessRef = useRef<HTMLImageElement>(null)
    const ref = useRef<HTMLImageElement>(null)
    const imageFiltersRef = useRef<HTMLDivElement>(null)
    const songIconRef = useRef<HTMLImageElement>(null)
    const [imageWidth, setImageWidth] = useState(0)
    const [imageHeight, setImageHeight] = useState(0)
    const [naturalWidth, setNaturalWidth] = useState(0)
    const [naturalHeight, setNaturalHeight] = useState(0)
    const [imageLoaded, setImageLoaded] = useState(false)
    const [pageBuffering, setPageBuffering] = useState(true)
    const [drag, setDrag] = useState(false)
    const [visible, setVisible] = useState(true)
    const [coverArt, setCoverArt] = useState(props.cached ? props.img : "")
    const [decrypted, setDecrypted] = useState("")
    const [selected, setSelected] = useState(false)
    const [hover, setHover] = useState(false)
    const navigate = useNavigate()
    const location = useLocation()

    const getFilter = () => {
        return `hue-rotate(${siteHue - 180}deg) saturate(${siteSaturation}%) brightness(${siteLightness + 70}%)`
    }

    useImperativeHandle(componentRef, () => ({
        shouldWait: async () => {
            return false
        },
        load: async () => {
            loadImage()
        }
    }))

    const loadImage = async () => {
        const decrypted = await functions.crypto.decryptItem(props.audio, session)
        setDecrypted(decrypted)
        if (!coverArt) {
            const decryptedImage = await functions.crypto.decryptThumb(props.img, session, `${props.audio}-${sizeType}`)
            setCoverArt(decryptedImage)
        }
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
        if (!scroll) if (!visible) setVisible(true)
    }, [scroll])

    useEffect(() => {
        if (typeof window === "undefined") return
        const observer = new IntersectionObserver(handleIntersection, {root: null, rootMargin: "0px 0px 100px 100px", threshold: 0.01})
        const element = containerRef.current
        if (element) observer.observe(element)
        return () => {
            observer.disconnect()
        }
    })

    useEffect(() => {
        setImageLoaded(false)
        setAudioReverse(false)
        setAudioSecondsProgress(0)
        setAudioSeekTo(null)
        if (ref.current) ref.current.style.opacity = "1"
        if (props.autoLoad) loadImage()
    }, [props.audio])

    const resizePixelateCanvas = () => {
        if (!pixelateRef.current || !ref.current) return
        pixelateRef.current.width = ref.current.clientWidth
        pixelateRef.current.height = ref.current.clientHeight
    }

    useEffect(() => {
        let observer = null as ResizeObserver | null
        if (coverArt) {
            observer = new ResizeObserver(resizePixelateCanvas)
            observer.observe(ref.current!)
        }
        return () => {
            observer?.disconnect()
        }
    }, [coverArt])

    const resizeOverlay = () => {
        if (!ref.current || !pixelateRef.current) return 
        pixelateRef.current.width = ref.current.width
        pixelateRef.current.height = ref.current.height
    }

    useEffect(() => {
        const element = ref.current!
        new ResizeObserver(resizeOverlay).observe(element)
    }, [])

    useEffect(() => {
        const element = ref.current!
        new ResizeObserver(resizeOverlay).observe(element)
        setTimeout(() => {
            setPageBuffering(false)
        }, 500)
    }, [])

    const getSquareOffset = () => {
        if (mobile) {
            if (sizeType === "tiny") return 20
            if (sizeType === "small") return 20
            if (sizeType === "medium") return 25
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
        const currentRef = ref.current!
        const refWidth = ref.current!.width
        const refHeight = ref.current!.height
        if (square || props.square) {
            const sidebarWidth = document.querySelector(".sidebar")?.clientWidth || 0
            const width = window.innerWidth - sidebarWidth
            const containerWidth = Math.floor(width / (mobile ? functions.render.getImagesPerRowMobile(sizeType) : functions.render.getImagesPerRow(sizeType))) - getSquareOffset()
            containerRef.current.style.width = props.height ? `${props.height}px` : `${containerWidth}px`
            containerRef.current.style.height = props.height ? `${props.height}px` : `${containerWidth}px`
            containerRef.current.style.marginBottom = props.marginBottom ? `${props.marginBottom}px` : "3px"
            containerRef.current.style.marginLeft = props.marginLeft ? `${props.marginLeft}px` : "0px"
            const landscape = refWidth <=refHeight
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
                setImageSize(80)
            } else if (sizeType === "small") {
                setImageSize(100)
            } else if (sizeType === "medium") {
                setImageSize(150)
            } else if (sizeType === "large") {
                setImageSize(230)
            } else if (sizeType === "massive") {
                setImageSize(400)
            }
        } else {
            if (sizeType === "tiny") {
                setImageSize(160)
            } else if (sizeType === "small") {
                setImageSize(200)
            } else if (sizeType === "medium") {
                setImageSize(240)
            } else if (sizeType === "large") {
                setImageSize(300)
            } else if (sizeType === "massive") {
                setImageSize(400)
            }
        }
    }, [sizeType])

    useEffect(() => {
        if (!imageFiltersRef.current) return
        const element = imageFiltersRef.current
        let newContrast = contrast
        const sharpenOverlay = overlayRef.current
        const lightnessOverlay = lightnessRef.current
        if (!coverArt || !sharpenOverlay || !lightnessOverlay) return
        if (sharpen !== 0) {
            const sharpenOpacity = sharpen / 5
            newContrast += 25 * sharpenOpacity
            sharpenOverlay.style.backgroundImage = `url(${coverArt})`
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

    const imagePixelate = () => {
        if (!pixelateRef.current || !ref.current) return
        const pixelateCanvas = pixelateRef.current
        const ctx = pixelateCanvas.getContext("2d")!
        const imageWidth = ref.current!.clientWidth 
        const imageHeight = ref.current!.clientHeight
        const landscape = imageWidth >= imageHeight
        ctx.clearRect(0, 0, pixelateCanvas.width, pixelateCanvas.height)
        pixelateCanvas.width = imageWidth
        pixelateCanvas.height = imageHeight
        const pixelWidth = imageWidth / pixelate 
        const pixelHeight = imageHeight / pixelate
        if (pixelate !== 1) {
            ctx.drawImage(ref.current, 0, 0, pixelWidth, pixelHeight)
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

    useEffect(() => {
        setTimeout(() => {
            imagePixelate()
        }, 50)
    }, [imageLoaded])

    useEffect(() => {
        setTimeout(() => {
            imagePixelate()
        }, 50)
    }, [pixelate, square, imageSize])

    const imageAnimation = (event: React.MouseEvent<HTMLDivElement>) => {
        if (!overlayRef.current || !pixelateRef.current || !lightnessRef.current || !songIconRef.current) return
        const currentRef = ref.current!
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
        songIconRef.current.style.transform = `translateX(${translateX}px) translateY(${translateY}px) scale(1.02)`
        pixelateRef.current.style.transformOrigin = "top left"
        pixelateRef.current.style.transform = `translateX(${translateX}px) translateY(${translateY}px) scale(1.02)`
    }

    const cancelImageAnimation = () => {
        if (!overlayRef.current || !pixelateRef.current || !lightnessRef.current || !songIconRef.current) return
        const currentRef = ref.current!
        currentRef.style.transform = "scale(1)"
        overlayRef.current.style.transform = "scale(1)"
        lightnessRef.current.style.transform = "scale(1)"
        songIconRef.current.style.transform = "scale(1)"
        pixelateRef.current.style.transformOrigin = "none"
        pixelateRef.current.style.transform = "scale(1)"
    }

    useEffect(() => {
        if (downloadFlag) {
            if (downloadIDs.includes(props.post.postID)) {
                functions.dom.download(path.basename(props.audio), decrypted)
                setDownloadIDs(downloadIDs.filter((s: string) => s !== props.post.postID))
                setDownloadFlag(false)
            }
        }
    }, [downloadFlag, decrypted])

    const onClick = (event: React.MouseEvent<HTMLElement>) => {
        //if (activeDropdown !== "none") return
        if (event.metaKey || event.ctrlKey || event.button === 1) {
            if (!location.pathname.includes("/post/")) setPost(null)
            event.preventDefault()
            const newWindow = window.open(`/post/${props.id}/${props.post.slug}`, "_blank")
            newWindow?.blur()
            window.focus()
        }
    }

    const mouseDown = (event: React.MouseEvent<HTMLElement>) => {
        setDrag(false)
    }

    const mouseMove = (event: React.MouseEvent<HTMLElement>) => {
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
            setToolTipImg(props.audio)
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

    const onLoad = (event: SyntheticEvent) => {
        const element = event.target as HTMLImageElement
        setImageWidth(element.width)
        setImageHeight(element.height)
        setNaturalWidth(element.naturalWidth)
        setNaturalHeight(element.naturalHeight)
        setImageLoaded(true)
        element.style.opacity = "1"
        props.onLoad?.()
    }

    const songClick = (event: React.MouseEvent) => {
        event.stopPropagation()
        setAudio(decrypted)
        setAudioPost(props.post)
        setPlayFlag("always")
    }


    return (
        <div style={{opacity: visible && ref.current?.width ? "1" : "0", transition: "opacity 0.1s", borderRadius: `${props.borderRadius || 0}px`}} className="image-box" id={String(props.id)} ref={containerRef} onClick={onClick} 
        onAuxClick={onClick} onMouseDown={mouseDown} onMouseUp={mouseUp} onMouseMove={mouseMove} onMouseEnter={mouseEnter} onMouseLeave={mouseLeave}>
            <div className="image-filters" ref={imageFiltersRef} onMouseMove={(event) => imageAnimation(event)} onMouseLeave={() => cancelImageAnimation()}>
                <img style={{opacity: hover ? "1" : "0", transition: "opacity 0.3s", filter: getFilter()}} className="song-icon" src={props.post.private ? privateIcon : musicNote} 
                ref={songIconRef} onClick={songClick} onMouseDown={(event) => {event.stopPropagation()}} onMouseUp={(event) => {event.stopPropagation()}}/>
                
                <img draggable={false} className="lightness-overlay" ref={lightnessRef} src={coverArt}/>
                <img draggable={false} className="sharpen-overlay" ref={overlayRef} src={coverArt}/>
                <canvas draggable={false} className="pixelate-canvas" ref={pixelateRef}></canvas>

                <img draggable={false} className="image" src={coverArt} onLoad={onLoad} ref={ref}/>
            </div>
        </div>
    )
})

export default GridSong