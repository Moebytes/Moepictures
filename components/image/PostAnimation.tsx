/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Moepictures - A cute and moe anime image board ❤          *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import React, {useEffect, useState, useRef, forwardRef, useImperativeHandle} from "react"
import {useNavigate} from "react-router-dom"
import withPostWrapper, {PostWrapperProps, PostWrapperRef} from "./withPostWrapper"
import {useSessionSelector, useFilterSelector, usePlaybackSelector, usePlaybackActions, useSearchSelector, useInteractionActions} from "../../store"
import Slider from "react-slider"
import ReverseIcon from "../../assets/svg/reverse.svg"
import SpeedIcon from "../../assets/svg/speed.svg"
import ClearIcon from "../../assets/svg/clear.svg"
import PlayIcon from "../../assets/svg/play.svg"
import PauseIcon from "../../assets/svg/pause.svg"
import FullscreenIcon from "../../assets/svg/fullscreen.svg"
import path from "path"
import functions from "../../functions/Functions"

let timer = null as any
let timeout = null as any
let id = 0

const PostAnimation = forwardRef<PostWrapperRef, PostWrapperProps>((props, parentRef) => {
    const {session} = useSessionSelector()
    const {brightness, contrast, hue, saturation, lightness, blur, sharpen, pixelate, splatter} = useFilterSelector()
    const {secondsProgress, progress, dragProgress, reverse, speed, paused, duration, dragging, seekTo} = usePlaybackSelector()
    const {setSecondsProgress, setProgress, setDragProgress, setReverse, setSpeed, setPaused, setDuration, 
    setDragging, setSeekTo} = usePlaybackActions()
    const {setEnableDrag} = useInteractionActions()
    const {imageExpand, format} = useSearchSelector()
    const gifControls = useRef<HTMLDivElement>(null)
    const gifSpeedRef = useRef<HTMLImageElement>(null)
    const gifSliderRef = useRef<Slider>(null)
    const [img, setImg] = useState("")
    const [zip, setZip] = useState("")
    const [encodingOverlay, setEncodingOverlay] = useState(false)
    const {toggleFullscreen, getCurrentBuffer, updateProgressText, seek, reset, changeReverse} = props
    const {naturalWidth, setNaturalWidth} = props
    const {naturalHeight, setNaturalHeight} = props
    const {imageLoaded, setImageLoaded} = props
    const {tempLink, setTempLink} = props
    const {gifData, setGIFData} = props
    const {backFrame, setBackFrame} = props
    const {fullscreen, setFullscreen} = props
    const {showSpeedDropdown, setShowSpeedDropdown} = props
    const {animationRef, imageRef, lightnessRef, overlayRef, effectRef, pixelateRef, onLoaded} = props
    const navigate = useNavigate()

    useImperativeHandle(parentRef, () => ({
        download: download
    }))

    const decryptImage = async () => {
        const decryptedImage = await functions.crypto.decryptItem(props.anim!, session)
        if (!decryptedImage) return
        if (functions.file.isZip(props.anim)) {
            const firstFrame = await functions.anim.ugoiraThumbnail(decryptedImage)
            setBackFrame(firstFrame)
            setImg(firstFrame)
            setZip(decryptedImage)
        } else {
            setBackFrame(decryptedImage)
            setImg(decryptedImage)
        }
    }

    const cancelAnimation = () => {
        clearTimeout(timeout)
        window.cancelAnimationFrame(id)
    }

    useEffect(() => {
        setImageLoaded(false)
        setReverse(false)
        setGIFData(null)
        setBackFrame("")
        setZip("")
        setSecondsProgress(0)
        setProgress(0)
        setDragProgress(0)
        setDragging(false)
        setSeekTo(null)
        cancelAnimation()
        if (props.anim) setTempLink(tempLink ? "" : localStorage.getItem("reverseSearchLink") || "")
        if (animationRef.current) animationRef.current.style.opacity = "1"
        decryptImage()
    }, [props.anim])

    useEffect(() => {
        clearTimeout(timer)
        timer = setTimeout(() => {
            decryptImage()
        }, 200)
    }, [props.anim, session])

    useEffect(() => {
        if (gifSliderRef.current) gifSliderRef.current.resize()
    })

    const parseGIF = async () => {
        const start = new Date()
        const arrayBuffer = await getCurrentBuffer(!session.upscaledImages)
        const frames = await functions.anim.extractGIFFrames(arrayBuffer)
        setGIFData(frames)
        const end = new Date()
        const seconds = (end.getTime() - start.getTime()) / 1000
        setSeekTo(seconds)
    }

    const parseAnimatedWebP = async () => {
        const start = new Date()
        const arrayBuffer = await getCurrentBuffer(!session.upscaledImages)
        const animated = functions.file.isAnimatedWebp(arrayBuffer)
        if (!animated) return 
        const frames = await functions.anim.extractAnimatedWebpFrames(arrayBuffer)
        setGIFData(frames)
        const end = new Date()
        const seconds = (end.getTime() - start.getTime()) / 1000
        setSeekTo(seconds)
    }

    const parseAnimatedPNG = async () => {
        const start = new Date()
        const arrayBuffer = await getCurrentBuffer(!session.upscaledImages)
        const animated = functions.file.isAnimatedPng(arrayBuffer)
        if (!animated) return 
        const frames = await functions.anim.extractAnimatedPngFrames(arrayBuffer)
        setGIFData(frames)
        const end = new Date()
        const seconds = (end.getTime() - start.getTime()) / 1000
        setSeekTo(seconds)
    }

    const parseUgoira = async () => {
        const start = new Date()
        const arrayBuffer = await getCurrentBuffer(!session.upscaledImages)
        const frames = await functions.anim.extractUgoiraFrames(arrayBuffer)
        setGIFData(frames)
        const end = new Date()
        const seconds = (end.getTime() - start.getTime()) / 1000
        setSeekTo(seconds)
    }
    
    const processFrames = () => {
        if (imageLoaded && functions.file.isGIF(props.anim)) {
            parseGIF()
        }

        if (imageLoaded && functions.file.isWebP(props.anim)) {
            parseAnimatedWebP()
        }

        if (imageLoaded && functions.file.isPNG(props.anim)) {
            parseAnimatedPNG()
        }

        if (imageLoaded && functions.file.isZip(props.anim)) {
            parseUgoira()
        }
    }

    useEffect(() => {
        setGIFData(null)
        processFrames()
    }, [imageLoaded, session.upscaledImages])

    useEffect(() => {
        if (!animationRef.current || !imageRef.current) return
        if (gifData) {
            if (paused && !dragging) return clearTimeout(timeout)
            const adjustedData = functions.anim.gifSpeed(gifData, speed)
            const gifCanvas = animationRef.current
            gifCanvas.style.opacity = "1"
            const landscape = gifCanvas.width >= gifCanvas.height
            if (landscape) {
                const aspectRatioInv = naturalHeight / naturalWidth
                gifCanvas.width = imageRef.current.clientWidth
                gifCanvas.height = imageRef.current.clientWidth * aspectRatioInv
            } else {
                const aspectRatio = naturalWidth / naturalHeight
                gifCanvas.width = imageRef.current.clientHeight * aspectRatio
                gifCanvas.height = imageRef.current.clientHeight
            }
            imageRef.current.style.opacity = "0"
            const ctx = gifCanvas.getContext("2d")!
            const frames = adjustedData.length - 1
            let duration = adjustedData.map((d) => d.delay).reduce((p, c) => p + c) / 1000
            let interval = duration / frames
            let sp = seekTo !== null ? seekTo : secondsProgress
            if (dragging) sp = dragProgress || 0
            let pos = Math.floor(sp / interval)
            if (!adjustedData[pos]) pos = 0
            let frame = adjustedData[pos].frame
            let delay = adjustedData[pos].delay
            setDuration(duration)

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
                const secondsProgress = (pos * interval)
                setSecondsProgress(secondsProgress)
                setProgress((secondsProgress / duration) * 100)
            }

            const draw = () => {
                const pixelWidth = gifCanvas.width / pixelate 
                const pixelHeight = gifCanvas.height / pixelate
                if (pixelate !== 1) {
                    ctx.clearRect(0, 0, gifCanvas.width, gifCanvas.height)
                    ctx.drawImage(frame, 0, 0, pixelWidth, pixelHeight)
                    if (landscape) {
                        gifCanvas.style.width = `${gifCanvas.width * pixelate}px`
                        gifCanvas.style.height = "auto"
                    } else {
                        gifCanvas.style.width = "auto"
                        gifCanvas.style.height = `${gifCanvas.height * pixelate}px`
                    }
                    gifCanvas.style.imageRendering = "pixelated"
                    gifCanvas.style.opacity = "1"
                } else {
                    gifCanvas.style.width = `${gifCanvas.width}px`
                    gifCanvas.style.height = `${gifCanvas.height}px`
                    gifCanvas.style.imageRendering = "none"
                    gifCanvas.style.opacity = "1"
                    ctx.clearRect(0, 0, gifCanvas.width, gifCanvas.height)
                    ctx.drawImage(frame, 0, 0, gifCanvas.width, gifCanvas.height)
                }
            }

            let lastTime = performance.now()

            const animate = (now: number) => {
                draw()
                if (paused) return clearTimeout(timeout)
                const delta = now - lastTime
                if (delta >= delay) {
                    update()
                    lastTime = now
                }
                id = window.requestAnimationFrame(animate)
            }
            id = window.requestAnimationFrame(animate)
        } return () => {
            clearTimeout(timeout)
            window.cancelAnimationFrame(id)
        }
    }, [gifData, reverse, seekTo, pixelate, splatter, paused, speed, dragging, dragProgress, imageExpand, fullscreen])

    const renderGIF = async () => {
        let filters = {brightness, contrast, hue, saturation, lightness, blur, sharpen, pixelate, splatter}
        if ((functions.image.filtersOn(filters) || functions.video.rateOn({speed, reverse})) && gifData) {
            if (encodingOverlay) return
            setEncodingOverlay(true)
            setPaused(true)
            await functions.timeout(50)
            const adjustedData = functions.anim.gifSpeed(gifData, speed)
            let frames = [] as ArrayBuffer[]
            let delays = [] as number[]
            for (let i = 0; i < adjustedData.length; i++) {
                let clientWidth = imageRef.current?.clientWidth!
                let clientHeight = imageRef.current?.clientHeight!
                frames.push(functions.image.render(adjustedData[i].frame, filters, true, {clientWidth, clientHeight}))
                delays.push(adjustedData[i].delay)
            }
            if (reverse) {
                frames = frames.reverse()
                delays = delays.reverse()
            }
            const buffer = await functions.anim.encodeGIF(frames, delays, gifData[0].frame.width, 
            gifData[0].frame.height, {transparentColor: "#000000"})
            const blob = new Blob([new Uint8Array(buffer)])
            setEncodingOverlay(false)
            setPaused(false)
            return window.URL.createObjectURL(blob)
        } else {
            return img
        }
    }

    const download = async () => {
        let filename = path.basename(props.anim!).replace(/\?.*$/, "")
        if (session.downloadPixivID && props.post?.source?.includes("pixiv.net")) {
            filename = props.post.source.match(/\d+/g)?.[0] + path.extname(props.anim!).replace(/\?.*$/, "")
        }
        if (functions.file.isZip(props.anim)) {
            return functions.dom.download(filename, zip)
        }
        const gif = await renderGIF()
        if (!gif) return
        if (gif !== img) filename = `${path.basename(filename, path.extname(filename))}.gif`
        functions.dom.download(filename, gif)
        window.URL.revokeObjectURL(gif)
    }

    const getSpeedMarginRight = () => {
        const controlRect = gifControls.current?.getBoundingClientRect()
        const rect = gifSpeedRef.current?.getBoundingClientRect()
        if (!rect || !controlRect) return "400px"
        const raw = controlRect.right - rect.right
        let offset = -5
        return `${raw + offset}px`
    }

    const controlMouseEnter = () => {
        if (gifControls.current) gifControls.current.style.opacity = "1"
    }

    const controlMouseLeave = () => {
        setShowSpeedDropdown(false)
        if (gifControls.current) gifControls.current.style.opacity = "0"
    }

    return (
        <>
        <img draggable={false} className="dummy-post-image" src={img}/>
        <div className="encoding-overlay" style={{display: encodingOverlay ? "flex" : "none"}}>
            <span className="encoding-overlay-text">{`Rendering GIF...`}</span>
        </div>
        <div className="gif-controls" ref={gifControls} onMouseUp={() => setDragging(false)} onMouseOver={controlMouseEnter} onMouseLeave={controlMouseLeave}>
            {duration >= 0.1 ?
            <div className="gif-control-row" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                <p className="gif-control-text">{dragging ? functions.date.formatSeconds(dragProgress || 0) : functions.date.formatSeconds(secondsProgress)}</p>
                <Slider ref={gifSliderRef} className="gif-slider" trackClassName="gif-slider-track" thumbClassName="gif-slider-thumb" min={0} max={100} 
                value={progress} onBeforeChange={() => setDragging(true)} onChange={(value) => updateProgressText(value)} onAfterChange={(value) => seek(reverse ? 100 - value : value)}/>
                <p className="gif-control-text">{functions.date.formatSeconds(duration)}</p>
            </div> : null}
            <div className="gif-control-row" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                <div className="gif-control-row-container">
                    <ReverseIcon className="gif-control-img" onClick={() => changeReverse()}/>
                    <SpeedIcon className="gif-control-img" ref={gifSpeedRef} onClick={() => setShowSpeedDropdown((prev) => !prev)}/>
                </div> 
                <div className="gif-control-row-container">
                    {/* <img className="control-img" src={gifRewindIcon}/> */}
                    {paused ?
                    <PlayIcon className="gif-control-img" onClick={() => setPaused(!paused)}/> :
                    <PauseIcon className="gif-control-img" onClick={() => setPaused(!paused)}/>}
                    {/* <img className="control-img" src={gifFastforwardIcon}/> */}
                </div>    
                <div className="gif-control-row-container">
                    <ClearIcon className="gif-control-img" onClick={() => reset()}/>
                </div> 
                <div className="gif-control-row-container">
                    <FullscreenIcon className="gif-control-img" onClick={() => toggleFullscreen()}/>
                </div> 
            </div>
            <div className={`gif-speed-dropdown ${showSpeedDropdown ? "" : "hide-speed-dropdown"}`} style={{marginRight: getSpeedMarginRight(), 
                marginTop: "-280px"}} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                <div className="gif-speed-dropdown-item" onClick={() => {setSpeed(4); setShowSpeedDropdown(false)}}>
                    <span className="gif-speed-dropdown-text">4x</span>
                </div>
                <div className="gif-speed-dropdown-item" onClick={() => {setSpeed(2); setShowSpeedDropdown(false)}}>
                    <span className="gif-speed-dropdown-text">2x</span>
                </div>
                <div className="gif-speed-dropdown-item" onClick={() => {setSpeed(1.75); setShowSpeedDropdown(false)}}>
                    <span className="gif-speed-dropdown-text">1.75x</span>
                </div>
                <div className="gif-speed-dropdown-item" onClick={() => {setSpeed(1.5); setShowSpeedDropdown(false)}}>
                    <span className="gif-speed-dropdown-text">1.5x</span>
                </div>
                <div className="gif-speed-dropdown-item" onClick={() => {setSpeed(1.25); setShowSpeedDropdown(false)}}>
                    <span className="gif-speed-dropdown-text">1.25x</span>
                </div>
                <div className="gif-speed-dropdown-item" onClick={() => {setSpeed(1); setShowSpeedDropdown(false)}}>
                    <span className="gif-speed-dropdown-text">1x</span>
                </div>
                <div className="gif-speed-dropdown-item" onClick={() => {setSpeed(0.75); setShowSpeedDropdown(false)}}>
                    <span className="gif-speed-dropdown-text">0.75x</span>
                </div>
                <div className="gif-speed-dropdown-item" onClick={() => {setSpeed(0.5); setShowSpeedDropdown(false)}}>
                    <span className="gif-speed-dropdown-text">0.5x</span>
                </div>
                <div className="gif-speed-dropdown-item" onClick={() => {setSpeed(0.25); setShowSpeedDropdown(false)}}>
                    <span className="gif-speed-dropdown-text">0.25x</span>
                </div>
            </div>
        </div>
        <img draggable={false} className="post-lightness-overlay" ref={lightnessRef} src={img}/>
        <img draggable={false} className="post-sharpen-overlay" ref={overlayRef} src={img}/>
        <canvas draggable={false} className="post-effect-canvas" ref={effectRef}></canvas>
        <canvas draggable={false} className="post-gif-canvas" ref={animationRef}></canvas>
    
        <img draggable={false} className={`${imageExpand? "post-image-expand" : "post-image"}`} ref={imageRef} 
        src={img} onLoad={(event) => onLoaded(event)} fetchPriority="high"/>
        </>
    )
})

export default withPostWrapper(PostAnimation)