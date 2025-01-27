import React, {useEffect, useRef, useState, useReducer} from "react"
import {useFilterSelector, useInteractionActions, useLayoutSelector, usePlaybackSelector, usePlaybackActions, 
useThemeSelector, useSearchSelector, useSearchActions, useFlagSelector, useFlagActions, useSessionSelector} from "../../store"
import functions from "../../structures/Functions"
import Slider from "react-slider"
import live2dZoomInIcon from "../../assets/icons/live2d-zoom-in.png"
import live2dZoomOutIcon from "../../assets/icons/live2d-zoom-out.png"
import live2dZoomOffIcon from "../../assets/icons/live2d-zoom-off.png"
import live2dZoomOffEnabledIcon from "../../assets/icons/live2d-zoom-off-enabled.png"
import live2dPlayIcon from "../../assets/icons/live2d-play.png"
import live2dPauseIcon from "../../assets/icons/live2d-pause.png"
import live2dHalfSpeedIcon from "../../assets/icons/live2d-0.5x.png"
import live2d1xSpeedIcon from "../../assets/icons/live2d-1x.png"
import live2d2xSpeedIcon from "../../assets/icons/live2d-2x.png"
import live2dParameterIcon from "../../assets/icons/live2d-parameter.png"
import live2dPartIcon from "../../assets/icons/live2d-part.png"
import live2dFullscreenIcon from "../../assets/icons/live2d-fullscreen.png"
import noteToggleOn from "../../assets/icons/note-toggle-on.png"
import expand from "../../assets/icons/expand.png"
import contract from "../../assets/icons/contract.png"
import NoteEditor from "./NoteEditor"
import path from "path"
import nextIcon from "../../assets/icons/go-right.png"
import prevIcon from "../../assets/icons/go-left.png"
import {Live2DCubismModel} from "live2d-renderer"
import {PostFull, PostHistory, UnverifiedPost} from "../../types/Types"
import "./styles/postmodel.less"

let id = null as any

interface Props {
    post?: PostFull | PostHistory | UnverifiedPost
    live2d: string
    width?: number
    height?: number
    scale?: number
    noKeydown?: boolean
    comicPages?: string[] | null
    order?: number
    noNotes?: boolean
    unverified?: boolean
    previous?: () => void
    next?: () => void
    noteID?: string | null
}

const PostLive2D: React.FunctionComponent<Props> = (props) => {
    const [ignored, forceUpdate] = useReducer(x => x + 1, 0)
    const {siteHue, siteSaturation, siteLightness} = useThemeSelector()
    const {setEnableDrag} = useInteractionActions()
    const {mobile} = useLayoutSelector()
    const {brightness, contrast, hue, saturation, lightness, blur, sharpen, pixelate} = useFilterSelector()
    const {disableZoom, paused} = usePlaybackSelector()
    const {setDisableZoom, setPaused} = usePlaybackActions()
    const {noteMode, imageExpand} = useSearchSelector()
    const {session} = useSessionSelector()
    const {setNoteMode, setNoteDrawingEnabled, setImageExpand} = useSearchActions()
    const {downloadFlag, downloadIDs} = useFlagSelector()
    const {setDownloadFlag, setDownloadIDs} = useFlagActions()
    const [showParameterDropdown, setShowParameterDropdown] = useState(false)
    const [showPartDropdown, setShowPartDropdown] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)
    const fullscreenRef = useRef<HTMLDivElement>(null)
    const rendererRef = useRef<HTMLCanvasElement>(null)
    const pixelateRef = useRef<HTMLCanvasElement>(null)
    const overlayRef = useRef<HTMLCanvasElement>(null)
    const lightnessRef = useRef<HTMLCanvasElement>(null)
    const live2dControls = useRef<HTMLDivElement>(null)
    const live2dParameterRef = useRef<HTMLImageElement>(null)
    const live2dPartRef = useRef<HTMLImageElement>(null)
    const [image, setImage] = useState(null as string | null)
    const [model, setModel] = useState(null as Live2DCubismModel | null)
    const [modelWidth, setModelWidth] = useState(0)
    const [modelHeight, setModelHeight] = useState(0)
    const [modelSpeed, setModelSpeed] = useState(1)
    const [defaultOpacities, setDefaultOpacities] = useState(new Float32Array())
    const [previousButtonHover, setPreviousButtonHover] = useState(false)
    const [nextButtonHover, setNextButtonHover] = useState(false)
    const [buttonHover, setButtonHover] = useState(false)
    const [decrypted, setDecrypted] = useState("")

    useEffect(() => {
        const savedSpeed = localStorage.getItem("live2dSpeed")
        if (savedSpeed) setModelSpeed(Number(savedSpeed))
        setPaused(false)
    }, [])

    useEffect(() => {
        localStorage.setItem("live2dSpeed", String(modelSpeed))
    }, [modelSpeed])

    const getFilter = () => {
        return `hue-rotate(${siteHue - 180}deg) saturate(${siteSaturation}%) brightness(${siteLightness + 70}%)`
    }

    const decryptLive2D = async () => {
        if (!props.live2d) return
        const decryptedLive2D = await functions.decryptItem(props.live2d, session)
        if (decryptedLive2D) setDecrypted(decryptedLive2D)
    }

    useEffect(() => {
        setModel(null)
    }, [props.live2d])

    useEffect(() => {
        decryptLive2D()
    }, [props.live2d, session])

    useEffect(() => {
        if (decrypted) loadLive2DModel()
    }, [decrypted])

    const loadLive2DModel = async () => {
        if (!decrypted || !rendererRef.current) return

        rendererRef.current.width = 700
        rendererRef.current.height = 700
        const model = new Live2DCubismModel(rendererRef.current)
        await model.load(decrypted)

        setModel(model)
        setModelWidth(model.width)
        setModelHeight(model.height)
        setDefaultOpacities(structuredClone(model.parts.opacities))
    }

    useEffect(() => {
        if (!model || !rendererRef.current) return

        model.paused = paused
        model.enableZoom = !disableZoom
        model.speed = modelSpeed
    }, [model, disableZoom, paused, modelSpeed])

    const resizeImageCanvas = () => {
        if (!pixelateRef.current || !rendererRef.current) return
        pixelateRef.current.width = rendererRef.current.clientWidth
        pixelateRef.current.height = rendererRef.current.clientHeight
    }

    const exitFullScreen = async () => {
        // @ts-ignore
        if (!document.fullscreenElement && !document.webkitIsFullScreen) {
            await fullscreen(true)
            resizeImageCanvas()
            forceUpdate()
        }
    }

    const handleKeydown = (event: KeyboardEvent) => {
        const key = event.keyCode
        const value = String.fromCharCode((96 <= key && key <= 105) ? key - 48 : key).toLowerCase()
        if (!(event.target instanceof HTMLTextAreaElement) && !(event.target instanceof HTMLInputElement) && 
            !(event.target instanceof HTMLElement && event.target.classList.contains("dialog-textarea"))) {
            if (value === "f") {
                if (!props.noKeydown) fullscreen()
            }
            if (value === "t") {
                setNoteMode(!noteMode)
                setNoteDrawingEnabled(true)
            }
        }
    }

    useEffect(() => {
        if (!rendererRef.current) return
        let observer = null as ResizeObserver | null
        observer = new ResizeObserver(resizeImageCanvas)
        observer.observe(rendererRef.current)
        window.addEventListener("keydown", handleKeydown)
        window.addEventListener("fullscreenchange", exitFullScreen)
        window.addEventListener("webkitfullscreenchange", exitFullScreen)
        return () => {
            observer?.disconnect()
            window.removeEventListener("keydown", handleKeydown)
            window.removeEventListener("fullscreenchange", exitFullScreen)
            window.removeEventListener("webkitfullscreenchange", exitFullScreen)
        }
    }, [])

    const getLive2DParameterMarginRight = () => {
        const controlRect = live2dControls.current?.getBoundingClientRect()
        const rect = live2dParameterRef.current?.getBoundingClientRect()
        if (!rect || !controlRect) return "400px"
        const raw = controlRect.right - rect.right
        let offset = -200
        return `${raw + offset}px`
    }

    const getLive2DPartMarginRight = () => {
        const controlRect = live2dControls.current?.getBoundingClientRect()
        const rect = live2dPartRef.current?.getBoundingClientRect()
        if (!rect || !controlRect) return "400px"
        const raw = controlRect.right - rect.right
        let offset = -160
        return `${raw + offset}px`
    }

    useEffect(() => {
        if (!fullscreenRef.current) return
        const element = fullscreenRef.current
        let newContrast = contrast
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
    }, [brightness, contrast, hue, saturation, lightness, blur, sharpen, image])

    const imagePixelate = () => {
        if (!pixelateRef.current || !containerRef.current || !rendererRef.current) return
        const pixelateCanvas = pixelateRef.current
        const ctx = pixelateCanvas.getContext("2d")!
        const imageWidth = rendererRef.current.clientWidth 
        const imageHeight = rendererRef.current.clientHeight
        const landscape = imageWidth >= imageHeight
        ctx.clearRect(0, 0, pixelateCanvas.width, pixelateCanvas.height)
        pixelateCanvas.width = imageWidth
        pixelateCanvas.height = imageHeight
        const pixelWidth = imageWidth / pixelate 
        const pixelHeight = imageHeight / pixelate
        if (pixelate !== 1) {
            ctx.drawImage(rendererRef.current, 0, 0, pixelWidth, pixelHeight)
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
    }, [pixelate, image])

    useEffect(() => {
        if (!props.post) return
        if (downloadFlag) {
            if (downloadIDs.includes(props.post.postID)) {
                functions.download(path.basename(props.live2d), decrypted)
                setDownloadIDs(downloadIDs.filter((s: string) => s !== props.post?.postID))
                setDownloadFlag(false)
            }
        }
    }, [downloadFlag, decrypted])

    const closeDropdowns = () => {
        setShowParameterDropdown(false)
        setShowPartDropdown(false)
    }

    const toggleDropdown = (dropdown: string) => {
        if (dropdown === "parameter") {
            if (showParameterDropdown) {
                setShowParameterDropdown(false)
            } else {
                closeDropdowns()
                setShowParameterDropdown(true)
            }
        }
        if (dropdown === "part") {
            if (showPartDropdown) {
                setShowPartDropdown(false)
            } else {
                closeDropdowns()
                setShowPartDropdown(true)
            }
        }
    }

    useEffect(() => {
        if (showParameterDropdown || showPartDropdown) {
            const loop = () => {
                forceUpdate()
                setTimeout(() => {
                    loop()
                }, 5)
            }
            loop()
        }
    }, [showParameterDropdown, showPartDropdown])

    const controlMouseEnter = () => {
        if (live2dControls.current) live2dControls.current.style.opacity = "1"
    }

    const controlMouseLeave = () => {
        setShowParameterDropdown(false)
        setShowPartDropdown(false)
        if (live2dControls.current) live2dControls.current.style.opacity = "0"
    }

    const getZoomOffIcon = () => {
        if (disableZoom) return live2dZoomOffEnabledIcon
        return live2dZoomOffIcon
    }

    const getPlayIcon = () => {
        if (paused) return live2dPlayIcon
        return live2dPauseIcon
    }

    const getFPSIcon = () => {
        if (modelSpeed === 0.5) return live2dHalfSpeedIcon
        if (modelSpeed === 1) return live2d1xSpeedIcon
        if (modelSpeed === 2) return live2d2xSpeedIcon
        return live2d1xSpeedIcon
    }

    const changeFPS = () => {
        if (modelSpeed === 0.5) return setModelSpeed(1)
        if (modelSpeed === 1) return setModelSpeed(2)
        if (modelSpeed === 2) return setModelSpeed(0.5)
        return setModelSpeed(1)
    }

    const fullscreen = async (exit?: boolean) => {
        // @ts-ignore
        if (document.fullscreenElement || document.webkitIsFullScreen || exit) {
            try {
                await document.exitFullscreen?.()
                // @ts-ignore
                await document.webkitExitFullscreen?.()
            } catch {
                // ignore
            }
            if (rendererRef.current) {
                rendererRef.current.style.maxWidth = ""
                rendererRef.current.style.maxHeight = ""
            }
            setTimeout(() => {
                resizeImageCanvas()
            }, 100)
        } else {
            try {
                await fullscreenRef.current?.requestFullscreen?.()
                // @ts-ignore
                await fullscreenRef.current?.webkitRequestFullscreen?.()
            } catch {
                // ignore
            }
            if (rendererRef.current) {
                rendererRef.current.style.maxWidth = "100vw"
                rendererRef.current.style.maxHeight = "100vh"
            }
            setTimeout(() => {
                resizeImageCanvas()
            }, 100)
        }
    }

    const loadImage = async () => {
        if (!image || !overlayRef.current || !lightnessRef.current) return
        const img = document.createElement("img")
        img.src = image
        img.onload = () => {
            if (!overlayRef.current || !lightnessRef.current) return
            const overlayCtx = overlayRef.current.getContext("2d")
            overlayRef.current.width = img.width
            overlayRef.current.height = img.height
            overlayCtx?.drawImage(img, 0, 0, img.width, img.height)
            const lightnessCtx = lightnessRef.current.getContext("2d")
            lightnessRef.current.width = img.width
            lightnessRef.current.height = img.height
            lightnessCtx?.drawImage(img, 0, 0, img.width, img.height)
        }
    }

    useEffect(() => {
        loadImage()
    }, [image])

    const zoomIn = () => {
        if (disableZoom) return
        if (model) {
            const zoomFactor = 1.1
            const maxScale = 10.0

            const newScale = Math.min(model.scale * zoomFactor, maxScale)
            const offsetX = model.x / model.scale
            const offsetY = model.x / model.scale
            model.scale = newScale
            model.x = model.x - offsetX * newScale
            model.y = model.y - offsetY * newScale
        }
    }

    const zoomOut = () => {
        if (disableZoom) return
        if (model) {
            const zoomFactor = 0.9
            const minScale = 0.01

            const newScale = Math.max(model.scale * zoomFactor, minScale)
            const offsetX = model.x / model.scale
            const offsetY = model.x / model.scale
            model.scale = newScale
            model.x = model.x - offsetX * newScale
            model.y = model.y - offsetY * newScale
        }
    }

    const parameterDropdownJSX = () => {
        if (!model) return null
        let jsx = [] as React.ReactElement[]

        let parameters = model.parameters
        const resetParameters = () => {
            for (let i = 0; i < parameters.ids.length; i++) {
                const defaultValue = parameters.defaultValues[i]
                model.setParameter(i, defaultValue)
            }
            model.model.update()
            forceUpdate()
        }

        for (let i = 0; i < parameters.ids.length; i++) {
            const id = parameters.ids[i]
            const value = parameters.values[i]
            const defaultValue = parameters.defaultValues[i]
            const min = parameters.minimumValues[i]
            const max = parameters.maximumValues[i]
            const keys = parameters.keyValues[i]
            const step = (Math.abs(max - min) / 100) || 0.01
            const updateParameter = (value: number) => {
                model.setParameter(i, value)
                forceUpdate()
            }
            jsx.push(
                <div className="live2d-dropdown-row live2d-row">
                    <span className="live2d-dropdown-text">{id}</span>
                    <Slider className="live2d-slider" trackClassName="live2d-slider-track" thumbClassName="live2d-slider-thumb" onChange={(value) => updateParameter(value)} min={min} max={max} step={step} value={value}/>
                </div>
            )
        }

        return (
            <div className={`live2d-dropdown ${showParameterDropdown ? "" : "hide-live2d-dropdown"}`}
            style={{marginRight: getLive2DParameterMarginRight(), top: `-300px`}}>
                <div className="live2d-dropdown-container">
                    {jsx}
                    <div className="live2d-dropdown-row live2d-row">
                        <button className="live2d-button" onClick={() => resetParameters()}>Reset</button>
                    </div>
                </div>
            </div>
        )
    }

    const partDropdownJSX = () => {
        if (!model) return null
        let jsx = [] as React.ReactElement[]

        let parts = model.parts

        const resetParts = () => {
            for (let i = 0; i < parts.ids.length; i++) {
                model.setPartOpacity(i, defaultOpacities[i] ?? 1)
            }
            model.model.update()
            forceUpdate()
        }

        for (let i = 0; i < parts.ids.length; i++) {
            const id = parts.ids[i]
            const opacity = parts.opacities[i]
            const updatePart = (value: number) => {
                model.setPartOpacity(i, value)
                forceUpdate()
            }
            jsx.push(
                <div className="live2d-dropdown-row live2d-row">
                    <span className="live2d-dropdown-text">{id}</span>
                    <Slider className="live2d-slider" trackClassName="live2d-slider-track" thumbClassName="live2d-slider-thumb" onChange={(value) => updatePart(value)} min={0} max={1} step={0.01} value={opacity}/>
                </div>
            )
        }

        return (
            <div className={`live2d-dropdown ${showPartDropdown ? "" : "hide-live2d-dropdown"}`}
            style={{marginRight: getLive2DPartMarginRight(), top: `-300px`}}>
                <div className="live2d-dropdown-container">
                    {jsx}
                    <div className="live2d-dropdown-row live2d-row">
                        <button className="live2d-button" onClick={() => resetParts()}>Reset</button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="post-model-container" style={{zoom: props.scale ? props.scale : 1}}>
            {!props.noNotes ? <NoteEditor post={props.post} img={props.live2d} order={props.order} unverified={props.unverified} noteID={props.noteID} imageWidth={modelWidth} imageHeight={modelHeight}/> : null}
            <div className="post-model-box" ref={containerRef}>
                <div className="post-model-filters" ref={fullscreenRef} onMouseOver={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                    <div className={`post-image-top-buttons ${buttonHover ? "show-post-image-top-buttons" : ""}`} onMouseEnter={() => setButtonHover(true)} onMouseLeave={() => setButtonHover(false)}>
                        {!props.noNotes ? <img draggable={false} className="post-image-top-button" src={noteToggleOn} style={{filter: getFilter()}} onClick={() => {setNoteMode(true); setNoteDrawingEnabled(true)}}/> : null}
                        <img draggable={false} className="post-image-top-button" src={imageExpand ? contract : expand} style={{filter: getFilter()}} onClick={() => setImageExpand(!imageExpand)}/>
                    </div>
                    <div className={`post-image-previous-button ${previousButtonHover ? "show-post-image-mid-buttons" : ""}`} onMouseEnter={() => setPreviousButtonHover(true)} onMouseLeave={() => setPreviousButtonHover(false)}>
                        <img draggable={false} className="post-image-mid-button" src={prevIcon} style={{filter: getFilter()}} onClick={() => props.previous?.()}/>
                    </div>
                    <div className={`post-image-next-button ${nextButtonHover ? "show-post-image-mid-buttons" : ""}`} onMouseEnter={() => setNextButtonHover(true)} onMouseLeave={() => setNextButtonHover(false)}>
                        <img draggable={false} className="post-image-mid-button" src={nextIcon} style={{filter: getFilter()}} onClick={() => props.next?.()}/>
                    </div>
                    <div className="relative-ref" style={{alignItems: "center", justifyContent: "center"}}>
                        <div className="image-controls" ref={live2dControls} onMouseOver={controlMouseEnter} onMouseLeave={controlMouseLeave}>
                            <div className="image-control-row" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                                <div className="image-control-row-container">
                                    <img draggable={false} className="image-control-img" onClick={() => setDisableZoom(!disableZoom)} src={getZoomOffIcon()}/>
                                    <img draggable={false} className="image-control-img" onClick={zoomOut} src={live2dZoomOutIcon}/>
                                    <img draggable={false} className="image-control-img" onClick={zoomIn} src={live2dZoomInIcon}/>
                                    <img draggable={false} className="image-control-img" onClick={() => setPaused(!paused)} src={getPlayIcon()}/>
                                    <img draggable={false} className="image-control-img" onClick={() => changeFPS()} src={getFPSIcon()}/>
                                    <img draggable={false} className="image-control-img" ref={live2dParameterRef} src={live2dParameterIcon} onClick={() => toggleDropdown("parameter")}/>
                                    <img draggable={false} className="image-control-img" ref={live2dPartRef} src={live2dPartIcon} onClick={() => toggleDropdown("part")}/>
                                    <img draggable={false} className="image-control-img" onClick={() => fullscreen()} src={live2dFullscreenIcon}/>
                                </div> 
                            </div>
                            {parameterDropdownJSX()}
                            {partDropdownJSX()}
                        </div>
                        <canvas draggable={false} className="post-lightness-overlay" ref={lightnessRef}></canvas>
                        <canvas draggable={false} className="post-sharpen-overlay" ref={overlayRef}></canvas>
                        <canvas draggable={false} className="post-pixelate-canvas" ref={pixelateRef}></canvas>
                        <canvas draggable={false} className="post-model-renderer" ref={rendererRef}></canvas>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default PostLive2D