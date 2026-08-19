/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Moepictures - A cute and moe anime image board ❤          *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import React, {useEffect, useState, useRef, forwardRef, useImperativeHandle} from "react"
import {useNavigate} from "react-router-dom"
import {createPortal} from "react-dom"
import withPostWrapper, {PostWrapperProps, PostWrapperRef} from "./withPostWrapper"
import {useSessionSelector, useFilterSelector, usePlaybackSelector, usePlaybackActions, useSearchSelector, useInteractionActions,
useMiscDialogActions, useMiscDialogSelector} from "../../store"
import ZoomInIcon from "../../assets/svg/zoom-in.svg"
import ZoomOutIcon from "../../assets/svg/zoom-out.svg"
import ZoomOffIcon from "../../assets/svg/zoom-off.svg"
import FullscreenIcon from "../../assets/svg/fullscreen.svg"
import ReaderIcon from "../../assets/svg/reader.svg"
import {TransformWrapper, TransformComponent, ReactZoomPanPinchRef} from "react-zoom-pan-pinch"
import functions from "../../functions/Functions"

let timer = null as any

const PostImage = forwardRef<PostWrapperRef, PostWrapperProps>((props, parentRef) => {
    const {session} = useSessionSelector()
    const {brightness, contrast, hue, saturation, lightness, blur, sharpen, pixelate, splatter} = useFilterSelector()
    const {zoom, disableZoom} = usePlaybackSelector()
    const {setZoom, setDisableZoom} = usePlaybackActions()
    const {setEnableDrag} = useInteractionActions()
    const {imageExpand, format} = useSearchSelector()
    const {segmentateFlag, lineartFlag} = useMiscDialogSelector()
    const {setSegmentateLink, setLineartLink, setSegmentateFlag, setLineartFlag} = useMiscDialogActions()
    const zoomRef = useRef<ReactZoomPanPinchRef>(null)
    const imageControls = useRef<HTMLDivElement>(null)
    const [img, setImg] = useState("")
    const [segmentated, setSegmentated] = useState("")
    const [lineart, setLineart] = useState("")
    const [showSegmentate, setShowSegmentate] = useState(false)
    const [showLineart, setShowLineart] = useState(false)
    const {toggleFullscreen, containerRef} = props
    const {imageLoaded, setImageLoaded} = props
    const {tempLink, setTempLink, getCurrentLink} = props
    const {imageRef, lightnessRef, overlayRef, effectRef, pixelateRef, onLoaded} = props
    const navigate = useNavigate()

    useImperativeHandle(parentRef, () => ({
        download: async () => {
            let img = props.img!
            if (showSegmentate && segmentated) img = segmentated
            if (showLineart && lineart) img = lineart
            return functions.image.download(img, imageRef.current!, props.post!, format, session, 
            {brightness, contrast, hue, blur, lightness, pixelate, saturation, sharpen, splatter}, 
            props.comicPages)
        },
        toggleLineart: toggleLineart,
        toggleSegmentate: toggleSegmentate
    }))

    const decryptImage = async () => {
        if (!props.img) return

        let decryptedImage = await functions.crypto.decryptItem(props.img, session)

        if (functions.file.isJXL((props.img))) {
            decryptedImage = await functions.image.decodeJXL(decryptedImage, "jpg")
        }

        setImg(decryptedImage)
    }

    useEffect(() => {
        setImageLoaded(false)
        setZoom(1)
        setLineart("")
        setSegmentated("")
        if (props.img) setTempLink(tempLink ? "" : localStorage.getItem("reverseSearchLink") || "")
        if (imageRef.current) imageRef.current.style.opacity = "1"
        decryptImage()
    }, [props.img])

    useEffect(() => {
        clearTimeout(timer)
        timer = setTimeout(() => {
            decryptImage()
        }, 200)
    }, [props.img, session])

    const zoomIn = () => {
        if (disableZoom || !zoomRef.current) return
        zoomRef.current.zoomIn(0.25, 0)
    }

    const zoomOut = () => {
        if (disableZoom || !zoomRef.current) return
        zoomRef.current.zoomOut(0.25, 0)
    }

    const controlMouseEnter = () => {
        if (imageControls.current) imageControls.current.style.opacity = "1"
    }

    const controlMouseLeave = () => {
        if (imageControls.current) imageControls.current.style.opacity = "0"
    }

    const toggleSegmentate = async () => {
        if (!segmentated) {
            setSegmentateLink(await getCurrentLink())
        } else {
            setShowLineart(false)
            setShowSegmentate((prev: boolean) => !prev)
        }
    }

    const toggleLineart = async () => {
        if (!lineart) {
            setLineartLink(await getCurrentLink())
        } else {
            setShowSegmentate(false)
            setShowLineart((prev: boolean) => !prev)
        }
    }

    useEffect(() => {
        if (segmentateFlag) {
            setSegmentated(segmentateFlag)
            setShowLineart(false)
            setShowSegmentate(true)
            setSegmentateFlag("")
        }
    }, [segmentateFlag])

    useEffect(() => {
        if (lineartFlag) {
            setLineart(lineartFlag)
            setShowSegmentate(false)
            setShowLineart(true)
            setLineartFlag("")
        }
    }, [lineartFlag])

    const getImg = () => {
        let result = img
        if (showSegmentate) result = segmentated || img
        if (showLineart) result = lineart || img
        return result
    }

    const imageControlsJSX = () => {
        const controls = (
            <div className="image-controls" ref={imageControls} onMouseOver={controlMouseEnter} onMouseLeave={controlMouseLeave}>
                <div className="image-control-row" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                    <div className="image-control-row-container">
                        {disableZoom ?
                        <ZoomOffIcon className="image-control-img-purple" onClick={() => setDisableZoom(!disableZoom)}/> :
                        <ZoomOffIcon className="image-control-img" onClick={() => setDisableZoom(!disableZoom)}/>}
                        <ZoomOutIcon className="image-control-img" onClick={zoomOut}/>
                        <ZoomInIcon className="image-control-img" onClick={zoomIn}/>
                        <FullscreenIcon className="image-control-img" onClick={() => toggleFullscreen()}/>
                        <ReaderIcon className="image-control-img" onClick={() => navigate(`/post/${props.post?.postID}/${props.post?.slug}/reader`)}/>
                    </div> 
                </div>
            </div>
        )
        return containerRef.current ? createPortal(controls, containerRef.current) : null
    }

    return (
        <>
        {imageControlsJSX()}
        <img draggable={false} className="dummy-post-image" src={getImg()}/>
        <TransformWrapper disabled={disableZoom} ref={zoomRef} minScale={1} maxScale={8} onZoomStop={(ref) => setZoom(ref.state.scale)} 
        wheel={{step: 0.1, touchPadDisabled: true}} zoomAnimation={{size: 0, disabled: true}} alignmentAnimation={{disabled: true}} 
        doubleClick={{mode: "reset", animationTime: 0}} panning={{disabled: zoom === 1}}>
        <TransformComponent wrapperStyle={{pointerEvents: disableZoom ? "none" : "all"}}>
            <img draggable={false} className="post-lightness-overlay" ref={lightnessRef} src={getImg()}/>
            <img draggable={false} className="post-sharpen-overlay" ref={overlayRef} src={getImg()}/>
            <canvas draggable={false} className="post-effect-canvas" ref={effectRef}></canvas>
            <canvas draggable={false} className="post-pixelate-canvas" ref={pixelateRef}></canvas>
            <img draggable={false} className={`${imageExpand? "post-image-expand" : "post-image"}`} ref={imageRef} 
            src={getImg()} onLoad={(event) => onLoaded(event)} fetchPriority="high"/>
        </TransformComponent>
        </TransformWrapper>
        </>
    )
})

export default withPostWrapper(PostImage)