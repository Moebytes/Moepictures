import React, {useEffect, useRef, useState, forwardRef, useImperativeHandle} from "react"
import {useHistory} from "react-router-dom"
import loading from "../../assets/icons/loading.gif"
import {useFilterSelector, useInteractionActions, useLayoutSelector, usePlaybackSelector, usePlaybackActions, useCacheActions,
useThemeSelector, useSearchSelector, useSessionSelector, useFlagSelector, useFlagActions, useSearchActions} from "../../store"
import path from "path"
import functions from "../../structures/Functions"
import "./styles/gridimage.less"
import * as PIXI from "pixi.js"
import type {Live2DModel} from "pixi-live2d-display"
import JSZip from "jszip"
import privateIcon from "../../assets/icons/lock-opt.png"
import {PostSearch} from "../../types/Types"

let tooltipTimer = null as any

interface Props {
    id: string
    img: string
    live2d: string
    post: PostSearch
    square?: boolean
    marginBottom?: number
    marginLeft?: number
    height?: number
    borderRadius?: number
    autoLoad?: boolean
    reupdate?: () => void
}

interface Ref {
    shouldWait: () => Promise<boolean>
    load: () => Promise<void>
    update: () => Promise<void>
}

const GridLive2D = forwardRef<Ref, Props>((props, componentRef) => {
    const {siteHue, siteSaturation, siteLightness} = useThemeSelector()
    const {mobile} = useLayoutSelector()
    const {session} = useSessionSelector()
    const {brightness, contrast, hue, saturation, lightness, blur, sharpen, pixelate} = useFilterSelector()
    const {reverse, speed, duration} = usePlaybackSelector()
    const {setSecondsProgress, setReverse, setSeekTo, setProgress, setDuration} = usePlaybackActions()
    const {sizeType, square, scroll, selectionMode, selectionItems, selectionPosts} = useSearchSelector()
    const {setSelectionItems, setSelectionPosts} = useSearchActions()
    const {downloadFlag, downloadIDs} = useFlagSelector()
    const {setDownloadFlag, setDownloadIDs} = useFlagActions()
    const {setScrollY, setToolTipX, setToolTipY, setToolTipEnabled, setToolTipPost, setToolTipImg} = useInteractionActions()
    const {setPost} = useCacheActions()
    const [imageSize, setImageSize] = useState(240)
    const containerRef = useRef<HTMLDivElement>(null)
    const pixelateRef = useRef<HTMLCanvasElement>(null)
    const overlayRef = useRef<HTMLCanvasElement>(null)
    const lightnessRef = useRef<HTMLCanvasElement>(null)
    const videoRef = useRef<HTMLVideoElement>(null)
    const imageFiltersRef = useRef<HTMLDivElement>(null)
    const videoOverlayRef = useRef<HTMLCanvasElement>(null)
    const rendererRef = useRef<HTMLCanvasElement>(null)
    const privateIconRef = useRef<HTMLImageElement>(null)
    const [imageWidth, setImageWidth] = useState(0)
    const [imageHeight, setImageHeight] = useState(0)
    const [naturalWidth, setNaturalWidth] = useState(0)
    const [naturalHeight, setNaturalHeight] = useState(0)
    const [imageLoaded, setImageLoaded] = useState(false)
    const [drag, setDrag] = useState(false)
    const [visible, setVisible] = useState(true)
    const [pageBuffering, setPageBuffering] = useState(true)
    const [screenshot, setScreenshot] = useState(null as string | null)
    const [selected, setSelected] = useState(false)
    const [hover, setHover] = useState(false)
    const [model, setModel] = useState(null as Live2DModel | null)
    const [decrypted, setDecrypted] = useState("")
    const imageRef = useRef<HTMLCanvasElement>(null)
    const history = useHistory()

    const getFilter = () => {
        return `hue-rotate(${siteHue - 180}deg) saturate(${siteSaturation}%) brightness(${siteLightness + 70}%)`
    }

    useImperativeHandle(componentRef, () => ({
        shouldWait: async () => {
            return true
        },
        load: async () => {
            load()
        },
        update: async () => {
            return mobile || !session.liveModelPreview ? loadImage() : loadModel()
        }
    }))

    const load = async () => {
        if (model) return
        return mobile || !session.liveModelPreview? loadImage() : loadModel()
    }

    useEffect(() => {
        props.reupdate?.()
    }, [imageSize])

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
    }, [])

    const loadImage = async () => {
        const img = await functions.decryptThumb(props.img, session)
        setScreenshot(img)
    }

    const loadModel = async () => {
        if (!props.live2d || !rendererRef.current) return
        const decrypted = await functions.decryptItem(props.live2d, session)
        setDecrypted(decrypted)

        // @ts-expect-error
        window.PIXI = PIXI
        const app = new PIXI.Application({
            view: rendererRef.current,
            autoStart: true,
            width: 800,
            height: 800,
            backgroundAlpha: 0
        })

        // @ts-expect-error
        const {Live2DModel, ZipLoader} = await import("pixi-live2d-display/cubism4")

        ZipLoader.zipReader = async (data: Blob, url: string) => {
            const zip = await JSZip.loadAsync(data)
            const renamedZip = new JSZip()
            await Promise.all(Object.keys(zip.files).map(async (relativePath) => {
                    const file = zip.files[relativePath]
                    const encodedPath = encodeURI(relativePath)
                    if (file.dir) {
                        renamedZip.folder(encodedPath)
                    } else {
                        const content = await file.async("blob")
                        renamedZip.file(encodedPath, content)
                    }
                })
            )
            return renamedZip
        }
        ZipLoader.readText = async (jsZip: JSZip, path: string) => {
            const file = jsZip.file(path)
            if (!file) throw new Error(`Cannot find file: ${path}`)
            const content = await file.async("text")
            return content
        }
        ZipLoader.getFilePaths = async (jsZip: JSZip) => {
            const paths: string[] = []
            jsZip.forEach((relativePath) => {
                if (relativePath.startsWith("__MACOSX/") ||
                    relativePath.includes(".DS_Store")) return
                paths.push(relativePath)
            })
            return paths
        }
        ZipLoader.getFiles = async (jsZip: JSZip, paths: string[]) => {
            const files = await Promise.all(paths.map(async (path) => {
                    const fileName = path.slice(path.lastIndexOf("/") + 1)
                    const blob = await jsZip.file(path)!.async("blob")
                    return new File([blob], fileName)
            }))
            return files
        }

        const model = await Live2DModel.from(decrypted)
        app.stage.addChild(model)

        setModel(model)

        const initialScale = Math.min(app.screen.width / model.internalModel.width, app.screen.height / model.internalModel.height)
        model.transform.scale.set(initialScale)
        model.transform.position.set(app.screen.width / 2, app.screen.height / 2)
        model.anchor.set(0.5)
        /*

        let isPanning = false
        let lastPosition = {x: 0, y: 0}

        const handleWheel = (event: WheelEvent) => {
            if (!rendererRef.current) return
            event.preventDefault()
        
            const zoomFactor = event.deltaY > 0 ? 0.9 : 1.1
            const minScale = 0.01
            const maxScale = 10.0
        
            const bounds = rendererRef.current.getBoundingClientRect()
            const mouseX = event.clientX - bounds.left
            const mouseY = event.clientY - bounds.top
        
            const worldMouseX = (mouseX - model.transform.position.x) / model.transform.scale.x
            const worldMouseY = (mouseY - model.transform.position.y) / model.transform.scale.y
            const newScaleX = Math.max(minScale, Math.min(model.transform.scale.x * zoomFactor, maxScale))
            const newScaleY = Math.max(minScale, Math.min(model.transform.scale.y * zoomFactor, maxScale))
        
            model.transform.scale.set(newScaleX, newScaleY)
            model.transform.position.x = mouseX - worldMouseX * model.transform.scale.x
            model.transform.position.y = mouseY - worldMouseY * model.transform.scale.y
        }

        const handleMouseDown = (event: MouseEvent) => {
            isPanning = true
            lastPosition = {x: event.clientX, y: event.clientY}
        }

        const handleMouseMove = (event: MouseEvent) => {
            if (isPanning) {
                const dx = event.clientX - lastPosition.x
                const dy = event.clientY - lastPosition.y
                model.transform.position.x += dx
                model.transform.position.y += dy
                lastPosition = {x: event.clientX, y: event.clientY}
            }
        }

        const handleMouseUp = (event: MouseEvent) => {
            isPanning = false
        }

        const handleDoubleClick = () => {
            model.transform.scale.set(initialScale)
            model.transform.position.set(app.screen.width / 2, app.screen.height / 2)
        }

        rendererRef.current.addEventListener("wheel", handleWheel)
        rendererRef.current.addEventListener("mousedown", handleMouseDown)
        rendererRef.current.addEventListener("mousemove", handleMouseMove)
        rendererRef.current.addEventListener("mouseup", handleMouseUp)
        rendererRef.current.addEventListener("dblclick", handleDoubleClick)
        rendererRef.current.addEventListener("contextmenu", (event) => event.preventDefault())

        return () => {
            if (!rendererRef.current) return
            rendererRef.current.removeEventListener("wheel", handleWheel)
            rendererRef.current.removeEventListener("mousedown", handleMouseDown)
            rendererRef.current.removeEventListener("mousemove", handleMouseMove)
            rendererRef.current.removeEventListener("mouseup", handleMouseUp)
            rendererRef.current.removeEventListener("dblclick", handleDoubleClick)
            rendererRef.current.removeEventListener("contextmenu", e => e.preventDefault())
        }*/
    }

    useEffect(() => {
        setImageLoaded(false)
        setModel(null)
        if (props.autoLoad) load()
    }, [props.live2d])

    const resizePixelateCanvas = () => {
        const currentRef = rendererRef.current ? rendererRef.current : imageRef.current
        if (!pixelateRef.current || !currentRef) return
        pixelateRef.current.width = currentRef.clientWidth
        pixelateRef.current.height = currentRef.clientHeight
    }

    useEffect(() => {
        const currentRef = rendererRef.current ? rendererRef.current : imageRef.current
        if (!currentRef) return
        let observer = null as ResizeObserver | null
        observer = new ResizeObserver(resizePixelateCanvas)
        observer.observe(currentRef)
        return () => {
            observer?.disconnect()
        }
    }, [])

    const resizeOverlay = () => {
        if (!rendererRef.current || !pixelateRef.current) return 
        pixelateRef.current.width = rendererRef.current.clientWidth
        pixelateRef.current.height = rendererRef.current.clientHeight
    }

    useEffect(() => {
        if (!rendererRef.current) return
        const element = rendererRef.current
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
        const currentRef = rendererRef.current ? rendererRef.current : imageRef.current
        if (!containerRef.current || !currentRef) return
        const refWidth = currentRef.clientWidth
        const refHeight = currentRef.clientHeight
        if (square || props.square) {
            const sidebarWidth = functions.sidebarWidth()
            const width = window.innerWidth - sidebarWidth
            const containerWidth = Math.floor(width / (mobile ? functions.getImagesPerRowMobile(sizeType) : functions.getImagesPerRow(sizeType))) - getSquareOffset()
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
        if (!screenshot || !sharpenOverlay || !lightnessOverlay) return
        if (sharpen !== 0) {
            const sharpenOpacity = sharpen / 5
            newContrast += 25 * sharpenOpacity
            sharpenOverlay.style.backgroundImage = `url(${screenshot})`
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
    }, [screenshot, brightness, contrast, hue, saturation, lightness, blur, sharpen])

    const imagePixelate = () => {
        const currentRef = rendererRef.current ? rendererRef.current : imageRef.current
        if (!pixelateRef.current || !currentRef) return
        const pixelateCanvas = pixelateRef.current
        const ctx = pixelateCanvas.getContext("2d")!
        const imageWidth = currentRef.clientWidth 
        const imageHeight = currentRef.clientHeight
        const landscape = imageWidth >= imageHeight
        ctx.clearRect(0, 0, pixelateCanvas.width, pixelateCanvas.height)
        pixelateCanvas.width = imageWidth
        pixelateCanvas.height = imageHeight
        const pixelWidth = imageWidth / pixelate 
        const pixelHeight = imageHeight / pixelate
        if (pixelate !== 1) {
            ctx.drawImage(currentRef, 0, 0, pixelWidth, pixelHeight)
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
    }, [])

    useEffect(() => {
        setTimeout(() => {
            imagePixelate()
        }, 50)
    }, [pixelate, square, imageSize, screenshot])

    const imageAnimation = (event: React.MouseEvent<HTMLDivElement>) => {
        const currentRef = rendererRef.current ? rendererRef.current : imageRef.current
        if (!overlayRef.current || !pixelateRef.current || !lightnessRef.current || !currentRef) return
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
    }

    const cancelImageAnimation = () => {
        const currentRef = rendererRef.current ? rendererRef.current : imageRef.current
        if (!overlayRef.current || !pixelateRef.current || !lightnessRef.current || !currentRef) return
        currentRef.style.transform = "scale(1)"
        overlayRef.current.style.transform = "scale(1)"
        lightnessRef.current.style.transform = "scale(1)"
        pixelateRef.current.style.transformOrigin = "none"
        pixelateRef.current.style.transform = "scale(1)"
    }

    useEffect(() => {
        if (downloadFlag) {
            if (downloadIDs.includes(props.post.postID)) {
                functions.download(path.basename(props.live2d), decrypted)
                setDownloadIDs(downloadIDs.filter((s: string) => s !== props.post.postID))
                setDownloadFlag(false)
            }
        }
    }, [downloadFlag, decrypted])

    const onClick = (event: React.MouseEvent<HTMLElement>) => {
        //if (activeDropdown !== "none") return
        if (event.metaKey || event.ctrlKey || event.button === 1) {
            if (!history.location.pathname.includes("/post/")) setPost(null)
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
        //if (activeDropdown !== "none") return
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
                    if (!history.location.pathname.includes("/post/")) setPost(null)
                    history.push(`/post/${props.id}/${props.post.slug}`)
                    window.scrollTo(0, 0)
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
            setToolTipImg(props.live2d)
            setToolTipEnabled(true)
        }, 200)
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
                return `0px 0px 0px 1px ${functions.borderColor(props.post)}`
            }
        } else {
            if (selected) {
                return "0px 0px 0px 4px var(--selectBorder)"
            } else {
                return `0px 0px 0px 2px ${functions.borderColor(props.post)}`
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

    const drawImage = async () => {
        if (!screenshot) return
        const currentRef = rendererRef.current ? rendererRef.current : imageRef.current
        if (!currentRef || !overlayRef.current || !lightnessRef.current) return
        const img = document.createElement("img")
        img.src = screenshot
        img.onload = () => {
            if (!currentRef || !overlayRef.current || !lightnessRef.current) return
            setImageWidth(img.width)
            setImageHeight(img.height)
            setNaturalWidth(img.naturalWidth)
            setNaturalHeight(img.naturalHeight)
            const refCtx = currentRef.getContext("2d")
            currentRef.width = img.width
            currentRef.height = img.height
            refCtx?.drawImage(img, 0, 0, img.width, img.height)
            const overlayCtx = overlayRef.current.getContext("2d")
            overlayRef.current.width = img.width
            overlayRef.current.height = img.height
            overlayCtx?.drawImage(img, 0, 0, img.width, img.height)
            const lightnessCtx = lightnessRef.current.getContext("2d")
            lightnessRef.current.width = img.width
            lightnessRef.current.height = img.height
            lightnessCtx?.drawImage(img, 0, 0, img.width, img.height)
            setImageLoaded(true)
            currentRef.style.opacity = "1"
        }
    }

    useEffect(() => {
        drawImage()
    }, [screenshot])

    return (
        <div style={{opacity: visible && rendererRef.current?.width ? "1" : "0", transition: "opacity 0.1s", width: "max-content", height: "max-content", 
        borderRadius: `${props.borderRadius || 0}px`}} className="image-box" id={String(props.id)} ref={containerRef} onClick={onClick} 
        onAuxClick={onClick} onMouseDown={mouseDown} onMouseUp={mouseUp} onMouseMove={mouseMove} onMouseEnter={mouseEnter} onMouseLeave={mouseLeave}>
            <div className="image-filters" ref={imageFiltersRef} onMouseMove={(event) => imageAnimation(event)} onMouseLeave={() => cancelImageAnimation()}>
                {props.post.private ? <img style={{opacity: hover ? "1" : "0", transition: "opacity 0.3s", filter: getFilter()}} className="song-icon" src={privateIcon} 
                ref={privateIconRef} onMouseDown={(event) => {event.stopPropagation()}} onMouseUp={(event) => {event.stopPropagation()}}/> : null}
                <canvas draggable={false} className="lightness-overlay" ref={lightnessRef}></canvas>
                <canvas draggable={false} className="sharpen-overlay" ref={overlayRef}></canvas>
                <canvas draggable={false} className="pixelate-canvas" ref={pixelateRef}></canvas>
                {mobile || !session.liveModelPreview ? <canvas className="image" ref={imageRef} style={{position: "absolute"}}></canvas> : null}
                <canvas className="grid-model-renderer" ref={rendererRef} style={mobile ? {display: "none"} : {}}></canvas>
            </div>
        </div>
    )
})

export default GridLive2D