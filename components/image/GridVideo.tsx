import React, {useEffect, useState, forwardRef, useImperativeHandle} from "react"
import withGridWrapper, {GridWrapperProps, GridWrapperRef} from "./withGridWrapper"
import {useSessionSelector, useSearchSelector, useFilterSelector, useLayoutSelector, 
usePlaybackSelector, usePlaybackActions} from "../../store"
import path from "path"
import functions from "../../functions/Functions"
import {CanvasDrawable} from "../../types/Types"

let id = 0

const GridVideo = forwardRef<GridWrapperRef, GridWrapperProps>((props, parentRef) => {
    const {mobile} = useLayoutSelector()
    const {session} = useSessionSelector()
    const {sharpen, pixelate} = useFilterSelector()
    const {reverse, speed, seekTo, secondsProgress} = usePlaybackSelector()
    const {setReverse, setSeekTo, setSecondsProgress} = usePlaybackActions()
    const {sizeType, square} = useSearchSelector()
    const [liveImg, setLiveImg] = useState("")
    const {imageLoaded, setImageLoaded} = props
    const {imageSize, setImageSize} = props
    const {hover, setHover} = props
    const {backFrame, setBackFrame} = props
    const [videoData, setVideoData] = useState(null as ImageBitmap[] | null)
    const {videoRef, lightnessRef, overlayRef, effectRef, pixelateRef, onLoaded, getCurrentBuffer, getCurrentLink} = props

    useImperativeHandle(props.componentRef, () => ({
        shouldWait: async () => {
            return true
        },
        load: async () => {
            loadImage()
        },
        update: async () => {
            if (!shouldUpdate()) return
            if (!videoData) {
                if (functions.file.isVideo(props.video)) return getVideoData()
            }
        }
    }))

    useImperativeHandle(parentRef, () => ({
        download: download
    }))

    const loadImage = async () => {
        const thumb = await functions.crypto.decryptThumb(props.img, session, `${props.img}-${sizeType}`, true)
        const liveImg = await functions.crypto.decryptThumb(props.live!, session, `${props.live}-${sizeType}`)
        setLiveImg(liveImg)
        setBackFrame(thumb)
    }

    const shouldUpdate = () => {
        if (reverse !== false) return true
        return false
    }

    useEffect(() => {
        if (shouldUpdate()) props.reupdate?.()
    }, [imageLoaded, reverse])
    
    const cancelAnimation = () => {
        videoRef.current?.cancelVideoFrameCallback(id)
    }

    useEffect(() => {
        setImageLoaded(false)
        setReverse(false)
        setVideoData(null)
        setSecondsProgress(0)
        setSeekTo(null)
        cancelAnimation()
        if (props.autoLoad) loadImage()
    }, [props.img])

    const getVideoData = async () => {
        if (!videoRef.current) return
        if (!mobile) {
            let frames = [] as ImageBitmap[]
            if (functions.file.isMP4(props.img)) {
                const link = getCurrentLink(true)
                frames = await functions.video.extractMP4Frames(link)
                if (!frames) return
            } else if (functions.file.isWebM(props.img)) {
                const arrayBuffer = await getCurrentBuffer(true)
                frames = await functions.video.extractWebMFrames(arrayBuffer)
                if (!frames) return
            }
            setVideoData(frames)
        }
    }

    useEffect(() => {
        if (!videoRef.current) return
        if (imageLoaded) {
            if (reverse && !videoData) return
            const adjustedData = videoData ? functions.video.videoSpeed(videoData, speed) : null
            videoRef.current.playbackRate = speed
            const pixelateCanvas = pixelateRef.current
            if (pixelateCanvas && videoRef.current) {
                pixelateCanvas.width = videoRef.current.clientWidth
                pixelateCanvas.height = videoRef.current.clientHeight
            }
            const pixelateCtx = pixelateCanvas?.getContext("2d")
            const sharpenOverlay = overlayRef.current
            if (sharpenOverlay && videoRef.current) {
                sharpenOverlay.width = videoRef.current.clientWidth
                sharpenOverlay.height = videoRef.current.clientHeight
            }
            let frame = videoRef.current as CanvasDrawable
            let pos = 0
            if (adjustedData) {
                const frames = adjustedData.length - 1
                const duration = videoRef.current.duration
                let interval = duration / frames
                let sp = seekTo !== null ? seekTo : secondsProgress
                pos = Math.floor(sp / interval)
                if (!adjustedData[pos]) pos = 0
                frame = adjustedData[pos]
            }

            const update = () => {
                if (adjustedData) {
                    if (reverse) {
                        pos--
                    } else {
                        pos++
                    }
                    if (pos > adjustedData.length - 1) pos = 0
                    if (pos < 0) pos = adjustedData.length - 1
                    frame = adjustedData[pos]
                    const frames = adjustedData.length - 1
                    const duration = videoRef.current!.duration
                    let interval = duration / frames
                    const secondsProgress = (pos * interval)
                    setSecondsProgress(secondsProgress)
                }
            }

            const draw = () => {
                if (sharpenOverlay) {
                    if (sharpen !== 0) {
                        const sharpenOpacity = sharpen / 5
                        sharpenOverlay.style.filter = `blur(4px) invert(1) contrast(75%)`
                        sharpenOverlay.style.mixBlendMode = "overlay"
                        sharpenOverlay.style.opacity = `${sharpenOpacity}`
                        sharpenOverlay.style.opacity = "1"
                    } else {
                        sharpenOverlay.style.filter = "none"
                        sharpenOverlay.style.mixBlendMode = "normal"
                        sharpenOverlay.style.opacity = "0"
                    }
                }
                if (pixelateCanvas) {
                    if (pixelate !== 1) {
                        const pixelWidth = pixelateCanvas.width / pixelate
                        const pixelHeight = pixelateCanvas.height / pixelate
                        pixelateCtx?.clearRect(0, 0, pixelateCanvas.width, pixelateCanvas.height)
                        pixelateCtx?.drawImage(frame, 0, 0, pixelWidth, pixelHeight)
                        const landscape = pixelateCanvas.width >= pixelateCanvas.height
                        if (landscape) {
                            pixelateCanvas.style.width = `${pixelateCanvas.width * pixelate}px`
                            pixelateCanvas.style.height = "auto"
                        } else {
                            pixelateCanvas.style.width = "auto"
                            pixelateCanvas.style.height = `${pixelateCanvas.height * pixelate}px`
                        }
                        pixelateCanvas.style.imageRendering = "pixelated"
                        pixelateCanvas.style.opacity = "1"
                    } else {
                        pixelateCanvas.style.width = `${pixelateCanvas.width}px`
                        pixelateCanvas.style.height = `${pixelateCanvas.height}px`
                        pixelateCanvas.style.imageRendering = "none"
                        pixelateCtx?.clearRect(0, 0, pixelateCanvas.width, pixelateCanvas.height)
                        pixelateCtx?.drawImage(frame, 0, 0, pixelateCanvas.width, pixelateCanvas.height)
                        pixelateCanvas.style.opacity = "0"
                    }
                }
            }

            const animate = () => {
                update()
                draw()
                id = videoRef.current!.requestVideoFrameCallback(animate)
            }
            id = videoRef.current.requestVideoFrameCallback(animate)
        }
        return () => {
            videoRef.current?.cancelVideoFrameCallback(id)
        }
    }, [imageLoaded, videoData, sharpen, pixelate, square, imageSize, reverse, speed, hover, session])

    const download = async () => {
        let filename = path.basename(props.video!).replace(/\?.*$/, "")
        if (session.downloadPixivID && props.post?.source?.includes("pixiv.net")) {
            filename = props.post.source.match(/\d+/g)?.[0] + path.extname(props.video!).replace(/\?.*$/, "")
        }
        functions.dom.download(filename, props.video!)
    }

    const getDisplay = (invert?: boolean) => {
        let condition = hover && !mobile
        if (session.liveAnimationPreview && !mobile) condition = true
        if (invert) condition = !condition
        return condition ? {opacity: "0", zIndex: 10, position: "absolute", width: "100%", height: "100%"} as React.CSSProperties : {opacity: "1"}
    }

    return (
        <>
        {!mobile ? <video draggable={false} autoPlay loop muted disablePictureInPicture playsInline className="dummy-video" ref={videoRef} src={liveImg}></video> : null}

        <img draggable={false} className="lightness-overlay" ref={lightnessRef} src={backFrame}/>
        <img draggable={false} className="sharpen-overlay" ref={overlayRef} src={backFrame}/>

        <canvas draggable={false} className="effect-canvas" ref={effectRef}></canvas>
        <canvas draggable={false} className="pixelate-canvas" ref={pixelateRef}></canvas>

        <video draggable={false} autoPlay loop muted disablePictureInPicture playsInline className="video" ref={videoRef} 
        src={liveImg} onLoadedData={(event) => onLoaded(event)} style={{...getDisplay(true)}}></video>
        <img draggable={false} className="image" src={backFrame} style={{...getDisplay()}}/>
        </>
    )
})

export default withGridWrapper(GridVideo)