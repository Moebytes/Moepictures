import React, {useEffect, useRef, useState, useReducer} from "react"
import {useNavigate} from "react-router-dom"
import {useFilterSelector, useInteractionActions, useLayoutSelector, usePlaybackSelector, usePlaybackActions,
useThemeSelector, useSearchSelector, useSessionSelector, useSearchActions, useFlagSelector, useFlagActions,
useMiscDialogActions, useInteractionSelector, useSessionActions, useActiveActions, usePostDialogActions} from "../../store"
import functions from "../../functions/Functions"
import permissions from "../../structures/Permissions"

import sourceIcon from "../../assets/svg/source.svg"
import shareIcon from "../../assets/svg/share.svg"
import reverseSearchIcon from "../../assets/svg/reverse-search.svg"
import wandIcon from "../../assets/svg/wand.svg"
import waifu2xIcon from "../../assets/svg/waifu2x.svg"
import noteToggleOn from "../../assets/svg/note-toggle-on.svg"
import expand from "../../assets/svg/expand.svg"
import contract from "../../assets/svg/contract.svg"

import lineartIcon from "../../assets/svg/lineart-process.svg"
import segmentateIcon from "../../assets/svg/segmentate.svg"

import google from "../../assets/svg/google.svg"
import bing from "../../assets/svg/bing.svg"
import yandex from "../../assets/svg/yandex.svg"
import saucenao from "../../assets/svg/saucenao.svg"
import ascii2d from "../../assets/svg/ascii2d.svg"
import twitter from "../../assets/svg/twitter.svg"
import reddit from "../../assets/svg/reddit.svg"
import pinterest from "../../assets/svg/pinterest.svg"
import qrcode from "../../assets/svg/qrcode.svg"

import nextIcon from "../../assets/svg/right.svg"
import prevIcon from "../../assets/svg/left.svg"
import NoteEditor from "./NoteEditor"
import QRCode from "qrcode"
import {GIFFrame, TagCount, PostFull, PostHistory, UnverifiedPost, UploadImage} from "../../types/Types"
import "./styles/postimage.less"

interface Props {
    post?: PostFull | PostHistory | UnverifiedPost
    img?: string
    anim?: string
    video?: string
    audio?: string
    model?: string
    live2d?: string
    coverImg?: string
    width?: number
    height?: number
    scale?: number
    noKeydown?: boolean
    comicPages?: string[] | null
    order?: number
    noNotes?: boolean
    unverified?: boolean
    uploadImage?: UploadImage
    previous?: () => void
    next?: () => void
    noteID?: string | null
    artists?: TagCount[]
    reader?: boolean
}

interface AddonProps {
    containerRef: React.RefObject<HTMLDivElement | null>
    fullscreenRef: React.RefObject<HTMLDivElement | null>
    imageRef: React.RefObject<HTMLImageElement | null>
    animationRef: React.RefObject<HTMLCanvasElement | null>
    videoRef: React.RefObject<HTMLVideoElement | null>
    audioRef: React.RefObject<HTMLImageElement | null>
    rendererRef: React.RefObject<HTMLCanvasElement | null>
    modelRef: React.RefObject<HTMLDivElement | null>
    live2DRef: React.RefObject<HTMLCanvasElement | null>
    lightnessRef: React.RefObject<HTMLImageElement | null>
    overlayRef: React.RefObject<HTMLImageElement | null>
    pixelateRef: React.RefObject<HTMLCanvasElement | null>
    effectRef: React.RefObject<HTMLCanvasElement | null>
    imageLoaded: boolean
    setImageLoaded: React.Dispatch<React.SetStateAction<boolean>>
    onLoaded: (event: React.SyntheticEvent) => void
    naturalWidth: number
    setNaturalWidth: React.Dispatch<React.SetStateAction<number>>
    naturalHeight: number
    setNaturalHeight: React.Dispatch<React.SetStateAction<number>>
    gifData: GIFFrame[] | null
    setGIFData: React.Dispatch<React.SetStateAction<GIFFrame[] | null>>
    backFrame: string
    setBackFrame: React.Dispatch<React.SetStateAction<string>>
    backFrameRef: React.RefObject<HTMLImageElement | null>
    fullscreen: boolean
    setFullscreen: React.Dispatch<React.SetStateAction<boolean>>
    tempLink: string
    setTempLink: React.Dispatch<React.SetStateAction<string>>
    audioTempLink: string
    setAudioTempLink: React.Dispatch<React.SetStateAction<string>>
    showSpeedDropdown: boolean
    setShowSpeedDropdown: React.Dispatch<React.SetStateAction<boolean>>
    getCurrentLink: (forceOriginal?: boolean | undefined) => string
    getCurrentBuffer: (forceOriginal?: boolean | undefined) => Promise<ArrayBuffer>
    toggleFullscreen: (exit?: boolean | undefined) => Promise<void>
    exitFullScreen: () => Promise<void>
    updateProgressText: (value: number) => void
    seek: (position: number) => void
    reset: () => void
    changeReverse: (value?: boolean | undefined) => void
    updateEffects: () => void
}

export interface PostWrapperRef {
    download: () => Promise<void>
    toggleSegmentate?: () => Promise<void>
    toggleLineart?: () => Promise<void>
}

export type PostWrapperProps = Props & AddonProps

const withPostWrapper = (WrappedComponent: React.ForwardRefExoticComponent<PostWrapperProps & React.RefAttributes<PostWrapperRef>>) => {
    const PostWrapper: React.FunctionComponent<Props> = (props) => {
        const [ignored, forceUpdate] = useReducer(x => x + 1, 0)
        const {siteHue, siteSaturation, siteLightness, i18n} = useThemeSelector()
        const {enableDrag} = useInteractionSelector()
        const {setEnableDrag} = useInteractionActions()
        const {mobile} = useLayoutSelector()
        const {session} = useSessionSelector()
        const {setSessionFlag} = useSessionActions()
        const {brightness, contrast, hue, saturation, lightness, blur, sharpen, pixelate, splatter} = useFilterSelector()
        const {zoom, disableZoom, duration, reverse, progress, dragging, dragProgress, secondsProgress} = usePlaybackSelector()
        const {setProgress, setDragging, setSeekTo, setReverse, setDragProgress, setSecondsProgress, setSpeed, 
        setPaused, setPreservePitch} = usePlaybackActions()
        const {noteMode, imageExpand, format} = useSearchSelector()
        const {setNoteMode, setNoteDrawingEnabled, setImageExpand} = useSearchActions()
        const {setActionBanner} = useActiveActions()
        const {downloadFlag, downloadIDs} = useFlagSelector()
        const {setDownloadFlag, setDownloadIDs, setRedirect} = useFlagActions()
        const {setPremiumRequired, setQRCodeImage} = useMiscDialogActions()
        const {setImgSourceID} = usePostDialogActions()
        const [imageWidth, setImageWidth] = useState(0)
        const [imageHeight, setImageHeight] = useState(0)
        const [fullscreen, setFullscreen] = useState(false)
        const [buttonHover, setButtonHover] = useState(false)
        const [previousButtonHover, setPreviousButtonHover] = useState(false)
        const [nextButtonHover, setNextButtonHover] = useState(false)
        const [showReverseIcons, setShowReverseIcons] = useState(false)
        const [showShareIcons, setShowShareIcons] = useState(false)
        const [showSpecialIcons, setShowSpecialIcons] = useState(false)
        const backFrameRef = useRef<HTMLImageElement>(null)
        const navigate = useNavigate()
        const childRef = useRef<PostWrapperRef | null>(null)

        /* State passed to children */
        const containerRef = useRef<HTMLDivElement>(null)
        const fullscreenRef = useRef<HTMLDivElement>(null)
        const imageRef = useRef<HTMLImageElement>(null)
        const animationRef = useRef<HTMLCanvasElement>(null)
        const videoRef = useRef<HTMLVideoElement>(null)
        const audioRef = useRef<HTMLImageElement>(null)
        const modelRef = useRef<HTMLDivElement>(null)
        const rendererRef = useRef<HTMLCanvasElement>(null)
        const live2DRef = useRef<HTMLCanvasElement>(null)
        const overlayRef = useRef<HTMLImageElement>(null)
        const lightnessRef = useRef<HTMLImageElement>(null)
        const pixelateRef = useRef<HTMLCanvasElement>(null)
        const effectRef = useRef<HTMLCanvasElement>(null)
        const [imageLoaded, setImageLoaded] = useState(false)
        const [naturalWidth, setNaturalWidth] = useState(0)
        const [naturalHeight, setNaturalHeight] = useState(0)
        const [showSpeedDropdown, setShowSpeedDropdown] = useState(false)
        const [tempLink, setTempLink] = useState("")
        const [audioTempLink, setAudioTempLink] = useState("")
        const [gifData, setGIFData] = useState(null as GIFFrame[] | null)
        const [backFrame, setBackFrame] = useState("")

        const getRef = () => {
            return imageRef.current || animationRef.current || videoRef.current ||
                audioRef.current || modelRef.current || live2DRef.current
        }

        const getImg = () => {
            return props.img || props.anim || props.video || 
                props.audio || props.model || props.live2d
        }

        const filter = functions.color.filter({siteHue, siteSaturation, siteLightness})

        const getIcon = (icon: string) => {
            return functions.color.colorizeSVG(icon, "--titleButtons")
        }

        const getPinkIcon = (icon: string) => {
            return functions.color.colorizeSVG(icon, "#ff69ff")
        }

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
            if (animationRef.current && imageRef.current) {
                animationRef.current.width = imageRef.current.clientWidth
                animationRef.current.height = imageRef.current.clientHeight
            }
            if (videoRef.current && backFrameRef.current) {
                videoRef.current.width = backFrameRef.current.clientWidth
                videoRef.current.height = backFrameRef.current.clientHeight
            }
        }

        const handleKeydown = (event: KeyboardEvent) => {
            const key = event.keyCode
            const value = String.fromCharCode((96 <= key && key <= 105) ? key - 48 : key).toLowerCase()
            if (!(event.target instanceof HTMLTextAreaElement) && !(event.target instanceof HTMLInputElement) && 
                !(event.target instanceof HTMLElement && event.target.classList.contains("dialog-textarea"))) {
                if (value === "f") {
                    if (!props.noKeydown) toggleFullscreen()
                }
                if (value === "t") {
                    setNoteMode(!noteMode)
                    setNoteDrawingEnabled(true)
                }
            }
        }

        useEffect(() => {
            let observer = null as ResizeObserver | null
            const currentRef = getRef()
            if (!currentRef) return
            observer = new ResizeObserver(resizeOverlays)
            observer.observe(currentRef)

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

        useEffect(() => {
            if (!fullscreenRef.current) return
            const element = fullscreenRef.current
            let newContrast = contrast
            const image = getImg()
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

        const getDrawableRef = () => {
            return imageRef.current || animationRef.current || audioRef.current 
                || rendererRef.current || live2DRef.current
        }

        const updateEffects = () => {
            functions.image.pixelateEffect(pixelateRef.current, getDrawableRef(), pixelate, 
            {isAnimation: Number(gifData?.length) > 0, isVideo: Boolean(videoRef.current)})
            functions.image.splatterEffect(effectRef.current, getDrawableRef(), splatter, {imageExpand,
            isAnimation: Number(gifData?.length) > 0, isVideo: Boolean(videoRef.current)})
        }

        useEffect(() => {
            setTimeout(() => {
                updateEffects()
            }, 800)
        }, [imageLoaded, imageExpand, fullscreen])

        useEffect(() => {
            functions.image.pixelateEffect(pixelateRef.current, getDrawableRef(), pixelate, 
            {isAnimation: Number(gifData?.length) > 0, isVideo: Boolean(videoRef.current)})
        }, [pixelate])

        useEffect(() => {
            functions.image.splatterEffect(effectRef.current, getDrawableRef(), splatter, {imageExpand,
            isAnimation: Number(gifData?.length) > 0, isVideo: Boolean(videoRef.current)})
        }, [splatter, imageExpand])

        const onLoaded = (event: React.SyntheticEvent) => {
            if (event.target instanceof HTMLVideoElement) {
                const element = event.target as HTMLVideoElement
                setImageWidth(element.clientWidth)
                setImageHeight(element.clientHeight)
                setNaturalWidth(element.videoWidth)
                setNaturalHeight(element.videoHeight)
                element.style.display = "flex"
                setTimeout(() => {
                    seek(0)
                }, 70)
            } else {
                const element = event.target as HTMLImageElement
                setImageWidth(element.width)
                setImageHeight(element.height)
                setNaturalWidth(element.naturalWidth)
                setNaturalHeight(element.naturalHeight)
                element.style.display = "flex"
            }
            setImageLoaded(true)
        }

        useEffect(() => {
            if (!props.post) return
            if (downloadFlag) {
                if (downloadIDs.includes(props.post.postID)) {
                    childRef.current?.download()
                    setDownloadIDs(downloadIDs.filter((s: string) => s !== props.post?.postID))
                    setDownloadFlag(false)
                }
            }
        }, [downloadFlag, session, format])

        const toggleFullscreen = async (exit?: boolean) => {
            const currentRef = getRef()
            if (!currentRef) return
            if (document.fullscreenElement || exit) {
                try {
                    await document.exitFullscreen?.()
                } catch {
                    // ignore
                }
                currentRef.style.maxWidth = ""
                currentRef.style.maxHeight = ""
                currentRef.style.width = "auto"
                currentRef.style.height = "auto"
                if (animationRef.current || videoRef.current) {
                    currentRef.style.marginTop = "0px"
                    currentRef.style.marginBottom = "0px"
                    if (pixelateRef.current) {
                        pixelateRef.current.style.marginTop = "0px"
                        pixelateRef.current.style.marginBottom = "0px"
                    }
                    if (effectRef.current) {
                        effectRef.current.style.marginTop = "0px"
                        effectRef.current.style.marginBottom = "0px"
                    }
                }
                if (backFrame && backFrameRef.current) {
                    currentRef.style.position = "absolute"
                    backFrameRef.current.style.display = "flex"
                }
                setTimeout(() => {
                    resizeOverlays()
                }, 100)
                setFullscreen(false)
            } else {
                try {
                    await fullscreenRef.current?.requestFullscreen?.()
                } catch {
                    // ignore
                }
                currentRef.style.maxWidth = "100vw"
                currentRef.style.maxHeight = "100vh"
                if (animationRef.current || videoRef.current) {
                    currentRef.style.marginTop = "auto"
                    currentRef.style.marginBottom = "auto"
                    if (pixelateRef.current) {
                        pixelateRef.current.style.marginTop = "auto"
                        pixelateRef.current.style.marginBottom = "auto"
                    }
                    if (effectRef.current) {
                        effectRef.current.style.marginTop = "auto"
                        effectRef.current.style.marginBottom = "auto"
                    }
                }
                if (backFrame && backFrameRef.current) {
                    currentRef.style.position = "relative"
                    backFrameRef.current.style.display = "none"
                }
                setTimeout(() => {
                    resizeOverlays()
                }, 100)
                setFullscreen(true)
            }
        }

        const exitFullScreen = async () => {
            if (!document.fullscreenElement) {
                await toggleFullscreen(true)
                resizeOverlays()
                forceUpdate()
            }
        }

        useEffect(() => {
            if (!dragging && dragProgress !== null) {
                setSecondsProgress(dragProgress)
                setProgress((dragProgress / duration) * 100)
                setDragProgress(null)
            }
        }, [dragging, dragProgress])

        const changeReverse = (value?: boolean) => {
            const val = value !== undefined ? value : !reverse 
            let secondsProgress = val === true ? (duration / 100) * (100 - progress) : (duration / 100) * progress
            if (gifData) secondsProgress = (duration / 100) * progress
            setReverse(val)
            setSeekTo(secondsProgress)
        }

        const updateProgressText = (value: number) => {
            let percent = value / 100
            if (reverse === true) {
                const secondsProgress = (1-percent) * duration
                setDragProgress(duration - secondsProgress)
            } else {
                const secondsProgress = percent * duration
                setDragProgress(secondsProgress)
            }
        }

        const seek = (position: number) => {
            let secondsProgress = (position / 100) * duration
            let progress = (duration / 100) * position
            setProgress(progress)
            setDragging(false)
            setSeekTo(secondsProgress)
        }

        const reset = () => {
            changeReverse(false)
            setSpeed(1)
            setPaused(false)
            setShowSpeedDropdown(false)
            setPreservePitch(true)
            setTimeout(() => {
                seek(0)
            }, 300)
        }

        const dragImgDown = () => {
            if (zoom !== 1 && !disableZoom) {
                if (enableDrag !== false) setEnableDrag(false)
            } else {
                if (enableDrag !== true) setEnableDrag(true)
            }
        }

        const dragImgUp = () => {
            setEnableDrag(true)
        }

        const toggleUpscale = async () => {
            if (!props.post) return
            if (!session.username) {
                setActionBanner("login-required")
                return
            }
            if (permissions.isPremium(session)) {
                functions.cache.clearResponseCacheKey("/api/user/session")
                await functions.http.post("/api/user/upscaledimages", null, session, setSessionFlag)
                setSessionFlag(true)
            } else {
                setPremiumRequired(true)
            }
        }

        const toggleSegmentate = async () => {
            if (!props.post) return
            if (!session.username) {
                setActionBanner("login-required")
                return
            }
            if (permissions.isPremium(session)) {
                childRef.current?.toggleSegmentate?.()
            } else {
                setPremiumRequired(true)
            }
        }

        const toggleLineart = async () => {
            if (!props.post) return
            if (!session.username) {
                setActionBanner("login-required")
                return
            }
            if (permissions.isPremium(session)) {
                childRef.current?.toggleLineart?.()
            } else {
                setPremiumRequired(true)
            }
        }

        useEffect(() => {
            if (mobile) setImageExpand(false)
        }, [mobile])

        const getCurrentLink = (forceOriginal?: boolean) => {
            if (!props.post) return getImg()!
            const showUpscaled = !forceOriginal && Boolean(session.upscaledImages)
            const image = props.post.images[(props.order || 1) - 1]
            let upscaledImage = props.post.upscaledImages?.[(props.order || 1) - 1] || image
            let currentImage = showUpscaled ? upscaledImage : image

            let img = ""
            if (typeof currentImage === "string") {
                img = functions.link.getRawImageLink(currentImage)
            } else {
                img = functions.link.getImageLink(currentImage, showUpscaled)
            }
            if (forceOriginal) {
                return functions.util.appendURLParams(img, {upscaled: false})
            } else {
                return functions.util.appendURLParams(img, {upscaled: session.upscaledImages})
            }
        }

        const getCurrentBuffer = async (forceOriginal?: boolean) => {
            let encryptedBuffer = new ArrayBuffer(0) 
            if (!props.post) return fetch(getImg()!).then((r) => r.arrayBuffer())
            const img = getCurrentLink(forceOriginal)
            if (forceOriginal) {
                encryptedBuffer = await fetch(functions.util.appendURLParams(img, {upscaled: false}), {headers: {"x-force-upscale": "false"}}).then((r) => r.arrayBuffer())
            } else {
                encryptedBuffer = await fetch(img).then((r) => r.arrayBuffer())
            }
            return functions.crypto.decryptBuffer(encryptedBuffer, img, session)
        }

        const generateTempLink = async (audio?: boolean, forceOriginal?: boolean) => {
            const link = getCurrentLink(forceOriginal)
            let url = await functions.http.post("/storage", {link, songCover: !audio}, session, setSessionFlag)
            if (audio) {
                setAudioTempLink(url)
            } else {
                localStorage.setItem("reverseSearchLink", url)
                setTempLink(url)
            }
            return url
        }

        const generateQRCode = async () => {
            let img = await generateTempLink(!Boolean(audioRef.current))
            QRCode.toDataURL(img, {margin: 0}, (err, url) => {
                setQRCodeImage(url)
            })
        }

        const sharePost = async (site: string) => {
            if (!props.post || !props.artists) return
            let url = `${functions.config.getDomain()}${window.location.pathname}`
            let text = `${props.post.englishTitle} (${props.post.title}) by ${props.artists[0].tag} (${props.post.artist})\n\n`
            if (site === "pinterest") {
                let img = await generateTempLink(!Boolean(audioRef.current))
                window.open(`http://pinterest.com/pin/create/button/?url=${encodeURIComponent(url)}&media=${img}&description=${encodeURIComponent(text)}`, "_blank")
            } else if (site === "twitter") {
                window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`, "_blank")
            } else if (site === "reddit") {
                window.open(`https://www.reddit.com/submit?url=${encodeURIComponent(url)}&title=${encodeURIComponent(text.trim())}`, "_blank")
            }
        }

        const reverseSearch = async (service: string) => {
            if (!props.post) return
            const baseMap = {
                "google": "https://lens.google.com/uploadbyurl?url=",
                "bing": "https://www.bing.com/images/searchbyimage?cbir=sbi&imgurl=",
                "yandex": "https://yandex.com/images/search?rpt=imageview&url=",
                "saucenao": "https://saucenao.com/search.php?url=",
                "ascii2d": "https://ascii2d.net/search/url/"
            }
            let img = await generateTempLink(!Boolean(audioRef.current), true)
            window.open(baseMap[service] + encodeURIComponent(img), "_blank", "noreferrer")
        }

        const editImgSource = () => {
            if (props.uploadImage) {
                setImgSourceID({uploadImage: props.uploadImage})
            } else {
                if (!props.post || "historyID" in props.post) return
                if (!session.username) {
                    setActionBanner("login-required")
                    return
                }
                let order = (props.order || 1) - 1
                setImgSourceID({post: props.post, image: props.post.images[order], unverified: props.unverified})
            }
        }

        const getSourceIcon = () => {
            if (props.uploadImage) {
                return props.uploadImage.altSource ? getPinkIcon(sourceIcon) : getIcon(sourceIcon)
            } else {
                if (!props.post) return sourceIcon
                let order = (props.order || 1) - 1
                if ("historyID" in props.post) {
                    if (props.post.imageSources?.[order]) return getPinkIcon(sourceIcon)
                } else {
                    if (props.post.images[order]?.altSource) return getPinkIcon(sourceIcon)
                }
                return getIcon(sourceIcon)
            }
        }

        const openDirectLink = (event: React.MouseEvent) => {
            event.preventDefault()
            if (props.uploadImage?.directLink) {
                window.open(props.uploadImage.directLink, "_blank")
            } else {
                if (!props.post) return
                let order = (props.order || 1) - 1
                if ("historyID" in props.post) {
                    if (props.post.imageLinks?.[order]) window.open(props.post.imageLinks[order], "_blank")
                } else {
                    if (props.post.images[order]?.directLink) {
                        window.open(props.post.images[order].directLink, "_blank")
                    }
                }
            }
        }

        const buttonMouseEnter = () => {
            setButtonHover(true)
            setShowShareIcons(false)
            setShowReverseIcons(false)
            setShowSpecialIcons(false)
        }

        const showAdditionalIcons = (type: "share" | "reverse" | "special") => {
            if (type === "share") {
                setShowReverseIcons(false)
                setShowSpecialIcons(false)
                setShowShareIcons((prev: boolean) => !prev)
            } else if (type === "reverse") {
                setShowShareIcons(false)
                setShowSpecialIcons(false)
                setShowReverseIcons((prev: boolean) => !prev)
            } else if (type === "special") {
                setShowShareIcons(false)
                setShowReverseIcons(false)
                setShowSpecialIcons((prev: boolean) => !prev)
            }
        }

        return (
            <div className="post-image-container" style={{zoom: props.scale ? props.scale : 1}}>
                {!props.noNotes ? <NoteEditor post={props.post} img={getImg()!} order={props.order} unverified={props.unverified} noteID={props.noteID} imageWidth={naturalWidth} imageHeight={naturalHeight} reader={props.reader}/> : null}
                <div className="post-image-box" ref={containerRef}>
                    <div className="post-image-filters" ref={fullscreenRef}>
                        <div className={`post-image-top-buttons ${buttonHover ? "show-post-image-top-buttons" : ""}`} onMouseEnter={buttonMouseEnter} onMouseLeave={() => setButtonHover(false)}>
                            <div className={`post-image-special-buttons ${showSpecialIcons ? "show-post-image-special-buttons" : ""}`}>
                                {showSpecialIcons ? <>
                                <img draggable={false} className="post-image-top-button" src={getIcon(segmentateIcon)} style={{filter}} onClick={toggleSegmentate}/>
                                <img draggable={false} className="post-image-top-button" src={getIcon(lineartIcon)} style={{filter}} onClick={toggleLineart}/>
                                </> : null}
                            </div>

                            <div className={`post-image-share-buttons ${showShareIcons ? "show-post-image-share-buttons" : ""}`}>
                                {showShareIcons ? <>
                                <img draggable={false} className="post-image-top-button" src={getIcon(qrcode)} style={{filter}} onClick={() => generateQRCode()}/>
                                <img draggable={false} className="post-image-top-button" src={getIcon(pinterest)} style={{filter}} onClick={() => sharePost("pinterest")}/>
                                <img draggable={false} className="post-image-top-button" src={getIcon(twitter)} style={{filter}} onClick={() => sharePost("twitter")}/>
                                <img draggable={false} className="post-image-top-button" src={getIcon(reddit)} style={{filter}} onClick={() => sharePost("reddit")}/>
                                </> : null}
                            </div>

                            <div className={`post-image-reverse-buttons ${showReverseIcons ? "show-post-image-reverse-buttons" : ""}`}>
                                {showReverseIcons ? <>
                                <img draggable={false} className="post-image-top-button"src={getIcon(google)} style={{filter}} onClick={() => reverseSearch("google")}/>
                                <img draggable={false} className="post-image-top-button" src={getIcon(bing)} style={{filter}} onClick={() => reverseSearch("bing")}/>
                                <img draggable={false} className="post-image-top-button" src={getIcon(yandex)} style={{filter}} onClick={() => reverseSearch("yandex")}/>
                                <img draggable={false} className="post-image-top-button" src={getIcon(saucenao)} style={{filter}} onClick={() => reverseSearch("saucenao")}/>
                                <img draggable={false} className="post-image-top-button" src={getIcon(ascii2d)} style={{filter}} onClick={() => reverseSearch("ascii2d")}/>
                                </> : null}
                            </div>

                            <img draggable={false} className="post-image-top-button" src={getSourceIcon()} style={{filter, marginRight: "6px"}} 
                                onClick={editImgSource} onContextMenu={openDirectLink}/>
                            {!props.noNotes ? <img draggable={false} className="post-image-top-button" src={getIcon(shareIcon)} style={{filter}} 
                                onClick={() => showAdditionalIcons("share")}/> : null}
                            {!props.noNotes ? <img draggable={false} className="post-image-top-button" src={getIcon(reverseSearchIcon)} style={{filter}} 
                                onClick={() => showAdditionalIcons("reverse")}/> : null}
                            {!props.noNotes && (props.post?.type === "image" || props.post?.type === "comic") ? <img draggable={false} className="post-image-top-button" 
                                src={getIcon(wandIcon)} style={{filter}} onClick={() => showAdditionalIcons("special")}/> : null}
                            {!props.noNotes ? <img draggable={false} className="post-image-top-button" src={getIcon(waifu2xIcon)} style={{filter}} 
                                onClick={() => toggleUpscale()}/> : null}
                            {!props.noNotes ? <img draggable={false} className="post-image-top-button" src={getIcon(noteToggleOn)} style={{filter}} 
                                onClick={() => {setNoteMode(true); setNoteDrawingEnabled(true)}}/> : null}
                            {!mobile ? <img draggable={false} className="post-image-top-button" src={imageExpand ? getIcon(contract) : getIcon(expand)} 
                                style={{filter}} onClick={() => setImageExpand(!imageExpand)}/> : null}
                        </div>
                        <div className={`post-image-previous-button ${previousButtonHover ? "show-post-image-mid-buttons" : ""}`} 
                            onMouseEnter={() => setPreviousButtonHover(true)} onMouseLeave={() => setPreviousButtonHover(false)}>
                            <img draggable={false} className="post-image-mid-button" src={getIcon(prevIcon)} style={{filter}} onClick={() => props.previous?.()}/>
                        </div>
                        <div className={`post-image-next-button ${nextButtonHover ? "show-post-image-mid-buttons" : ""}`} 
                            onMouseEnter={() => setNextButtonHover(true)} onMouseLeave={() => setNextButtonHover(false)}>
                            <img draggable={false} className="post-image-mid-button" src={getIcon(nextIcon)} style={{filter}} onClick={() => props.next?.()}/>
                        </div>
                        <div className="relative-ref" onMouseMove={dragImgDown} onMouseLeave={dragImgUp}>
                            <WrappedComponent 
                                {...props}
                                ref={childRef}
                                containerRef={containerRef}
                                fullscreenRef={fullscreenRef}
                                imageRef={imageRef}
                                animationRef={animationRef}
                                videoRef={videoRef}
                                audioRef={audioRef}
                                rendererRef={rendererRef}
                                modelRef={modelRef}
                                live2DRef={live2DRef}
                                lightnessRef={lightnessRef}
                                overlayRef={overlayRef}
                                effectRef={effectRef}
                                pixelateRef={pixelateRef}
                                imageLoaded={imageLoaded}
                                setImageLoaded={setImageLoaded}
                                onLoaded={onLoaded}
                                naturalWidth={naturalWidth}
                                setNaturalWidth={setNaturalWidth}
                                naturalHeight={naturalHeight}
                                setNaturalHeight={setNaturalHeight}
                                tempLink={tempLink}
                                setTempLink={setTempLink}
                                audioTempLink={audioTempLink}
                                setAudioTempLink={setAudioTempLink}
                                gifData={gifData}
                                setGIFData={setGIFData}
                                backFrame={backFrame}
                                setBackFrame={setBackFrame}
                                backFrameRef={backFrameRef}
                                getCurrentLink={getCurrentLink}
                                getCurrentBuffer={getCurrentBuffer}
                                toggleFullscreen={toggleFullscreen}
                                exitFullScreen={exitFullScreen}
                                fullscreen={fullscreen}
                                setFullscreen={setFullscreen}
                                updateProgressText={updateProgressText}
                                showSpeedDropdown={showSpeedDropdown}
                                setShowSpeedDropdown={setShowSpeedDropdown}
                                changeReverse={changeReverse}
                                seek={seek}
                                reset={reset}
                                updateEffects={updateEffects}
                            />
                        </div>
                    </div>
                </div>
            </div>
        )
    }
    return PostWrapper
}

export default withPostWrapper

