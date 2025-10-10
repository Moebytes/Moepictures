import React, {useEffect, useState, forwardRef, useImperativeHandle} from "react"
import withGridWrapper, {GridWrapperProps, GridWrapperRef} from "./withGridWrapper"
import {useSessionSelector, useSearchSelector, useFilterSelector, useLayoutSelector, 
usePlaybackSelector, usePlaybackActions} from "../../store"
import path from "path"
import functions from "../../functions/Functions"
import {GIFFrame, CanvasDrawable} from "../../types/Types"

let id = 0

const GridAnimation = forwardRef<GridWrapperRef, GridWrapperProps>((props, parentRef) => {
    const {mobile} = useLayoutSelector()
    const {session} = useSessionSelector()
    const {sharpen, pixelate} = useFilterSelector()
    const {reverse, speed, seekTo, secondsProgress} = usePlaybackSelector()
    const {setReverse, setSeekTo, setSecondsProgress} = usePlaybackActions()
    const {sizeType, square, format} = useSearchSelector()
    const [img, setImg] = useState(props.cached ? props.img : "")
    const [staticImg, setStaticImg] = useState("")
    const [liveImg, setLiveImg] = useState("")
    const {imageLoaded, setImageLoaded} = props
    const {imageWidth, setImageWidth} = props
    const {imageHeight, setImageHeight} = props
    const {naturalWidth, setNaturalWidth} = props
    const {naturalHeight, setNaturalHeight} = props
    const {imageSize, setImageSize} = props
    const {hover, setHover} = props
    const {gifData, setGIFData} = props
    const {animationRef, lightnessRef, overlayRef, effectRef, pixelateRef} = props

    useImperativeHandle(props.componentRef, () => ({
        shouldWait: async () => {
            return true
        },
        load: async () => {
            loadImage()
        },
        update: async () => {
            if (!shouldUpdate()) return
            if (!gifData) {
                if (functions.file.isGIF(props.original)) return parseGIF()
                if (functions.file.isWebP(props.original)) return parseAnimatedWebP()
            }
        }
    }))

    useImperativeHandle(parentRef, () => ({
        download: download
    }))

    const loadImage = async () => {
        const decryptedImg = await functions.crypto.decryptThumb(props.img, session, `${props.img}-${sizeType}`)
        const liveImg = await functions.crypto.decryptThumb(props.live!, session, `${props.live}-${sizeType}`)
        setLiveImg(liveImg)
        setImg(decryptedImg)
        setStaticImg(decryptedImg)
    }

    const toggleLive = async () => {
        if (session.liveAnimationPreview) return
        if (hover) {
            setImg(liveImg)
        } else {
            setImg(staticImg)
        }
    }

    useEffect(() => {
        toggleLive()
    }, [hover, liveImg, staticImg, session, mobile])

    const shouldUpdate = () => {
        if (reverse !== false || speed !== 1 || pixelate !== 1) return true
        return false
    }

    useEffect(() => {
        if (shouldUpdate()) props.reupdate?.()
    }, [imageLoaded, reverse, speed, pixelate])
    
    const cancelAnimation = () => {
        window.cancelAnimationFrame(id)
    }

    useEffect(() => {
        setImageLoaded(false)
        setReverse(false)
        setGIFData(null)
        setSecondsProgress(0)
        setSeekTo(null)
        cancelAnimation()
        if (props.autoLoad) loadImage()
    }, [props.img])

    const parseGIF = async () => {
        const start = new Date()
        const arrayBuffer = await fetch(img).then((r) => r.arrayBuffer())
        const frames = await functions.video.extractGIFFrames(arrayBuffer)
        setGIFData(frames)
        const end = new Date()
        const seconds = (end.getTime() - start.getTime()) / 1000
        setSeekTo(seconds)
    }

    const parseAnimatedWebP = async () => {
        const start = new Date()
        const arrayBuffer = await fetch(img).then((r) => r.arrayBuffer())
        const animated = functions.file.isAnimatedWebp(arrayBuffer)
        if (!animated) return 
        const frames = await functions.video.extractAnimatedWebpFrames(arrayBuffer)
        setGIFData(frames)
        const end = new Date()
        const seconds = (end.getTime() - start.getTime()) / 1000
        setSeekTo(seconds)
    }

    useEffect(() => {
        if (!gifData) return
        if (imageLoaded) {
            const adjustedData = functions.video.gifSpeed(gifData, speed)
            const pixelateCanvas = pixelateRef.current
            if (pixelateCanvas && animationRef.current) {
                pixelateCanvas.width = animationRef.current.width
                pixelateCanvas.height = animationRef.current.height
            }
            const pixelateCtx = pixelateCanvas?.getContext("2d")
            const sharpenOverlay = overlayRef.current
            if (sharpenOverlay && animationRef.current) {
                sharpenOverlay.width = animationRef.current.width
                sharpenOverlay.height = animationRef.current.height
            }
            let frame = animationRef.current as CanvasDrawable
            let delay = 0
            let pos = 0
            const frames = adjustedData.length - 1
            const duration = adjustedData.map((d: GIFFrame) => d.delay).reduce((p, c) => p + c) / 1000
            let interval = duration / frames
            let sp = seekTo !== null ? seekTo : secondsProgress
            pos = Math.floor(sp / interval)
            if (!adjustedData[pos]) pos = 0
            frame = adjustedData[pos].frame
            delay = adjustedData[pos].delay

            const update = () => {
                if (reverse) {
                    pos--
                } else {
                    pos++
                }
                if (pos > adjustedData.length - 1) pos = 0
                if (pos < 0) pos = adjustedData.length - 1
                frame = adjustedData[pos].frame
                delay = adjustedData[pos].delay
                if (delay < 0) delay = 0
                const frames = adjustedData.length - 1
                const duration = adjustedData.map((d: GIFFrame) => d.delay).reduce((p, c) => p + c) / 1000
                let interval = duration / frames
                const secondsProgress = (pos * interval)
                setSecondsProgress(secondsProgress)
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

            let lastTime = performance.now()

            const animate = (now: number) => {
                const delta = now - lastTime
                if (delta >= delay) {
                    update()
                    draw()
                    lastTime = now
                }
                id = window.requestAnimationFrame(animate)
            }
            id = window.requestAnimationFrame(animate)
        }
        return () => {
            window.cancelAnimationFrame(id)
        }
    }, [imageLoaded, gifData, sharpen, pixelate, square, imageSize, reverse, speed, hover, session])

    const download = async () => {
        let filename = path.basename(props.original).replace(/\?.*$/, "")
        if (session.downloadPixivID && props.post?.source?.includes("pixiv.net")) {
            filename = props.post.source.match(/\d+/g)?.[0] + path.extname(props.original).replace(/\?.*$/, "")
        }
        functions.dom.download(filename, props.original)
    }

    const onLoad = (event: React.SyntheticEvent) => {
        let element = event.target as HTMLImageElement
        setImageWidth(element.width)
        setImageHeight(element.height)
        setNaturalWidth(element.naturalWidth)
        setNaturalHeight(element.naturalHeight)
        setImageLoaded(true)
        props.onLoad?.()
    }

    const dynamicSrc = () => {
        return !hover ? staticImg : img
    }

    return (
        <>
        <img draggable={false} className="lightness-overlay" ref={lightnessRef} src={dynamicSrc()}/>
        <img draggable={false} className="sharpen-overlay" ref={overlayRef} src={dynamicSrc()}/>

        <canvas draggable={false} className="effect-canvas" ref={effectRef}></canvas>
        <canvas draggable={false} className="pixelate-canvas" ref={pixelateRef}></canvas>

        <img draggable={false} className="image" ref={animationRef} src={dynamicSrc()} 
        onLoad={(event) => onLoad(event)} style={{opacity: "1"}}/>
        </>
    )
})

export default withGridWrapper(GridAnimation)