import React, {useEffect, useState, useRef, forwardRef, useImperativeHandle} from "react"
import {useNavigate} from "react-router-dom"
import withPostWrapper, {PostWrapperProps, PostWrapperRef} from "./withPostWrapper"
import {useSessionSelector, useFilterSelector, usePlaybackSelector, usePlaybackActions, useSearchSelector, useInteractionActions} from "../../store"
import imageZoomInIcon from "../../assets/icons/image-zoom-in.png"
import imageZoomOutIcon from "../../assets/icons/image-zoom-out.png"
import imageZoomOffIcon from "../../assets/icons/image-zoom-off.png"
import imageZoomOffEnabledIcon from "../../assets/icons/image-zoom-off-enabled.png"
import imageFullscreenIcon from "../../assets/icons/image-fullscreen.png"
import imageReaderIcon from "../../assets/icons/image-reader.png"
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
    const zoomRef = useRef<ReactZoomPanPinchRef>(null)
    const imageControls = useRef<HTMLDivElement>(null)
    const [img, setImg] = useState("")
    const {toggleFullscreen} = props
    const {imageLoaded, setImageLoaded} = props
    const {tempLink, setTempLink} = props
    const {imageRef, lightnessRef, overlayRef, effectRef, pixelateRef, onLoaded} = props
    const navigate = useNavigate()

    useImperativeHandle(parentRef, () => ({
        download: async () => {
            return functions.image.download(props.img!, imageRef.current!, props.post!, format, session, 
            {brightness, contrast, hue, blur, lightness, pixelate, saturation, sharpen, splatter}, 
            props.comicPages)
        }
    }))

    const decryptImage = async () => {
        if (!props.img) return
        const decryptedImage = await functions.crypto.decryptItem(props.img, session)
        setImg(decryptedImage)
    }

    useEffect(() => {
        setImageLoaded(false)
        setZoom(1)
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

    const getZoomOffIcon = () => {
        if (disableZoom) return imageZoomOffEnabledIcon
        return imageZoomOffIcon
    }

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

    return (
        <>
        <img draggable={false} className="dummy-post-image" src={img}/>
        <div className="image-controls" ref={imageControls} onMouseOver={controlMouseEnter} onMouseLeave={controlMouseLeave}>
            <div className="image-control-row" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                <div className="image-control-row-container">
                    <img draggable={false} className="image-control-img" onClick={() => setDisableZoom(!disableZoom)} src={getZoomOffIcon()}/>
                    <img draggable={false} className="image-control-img" onClick={zoomOut} src={imageZoomOutIcon}/>
                    <img draggable={false} className="image-control-img" onClick={zoomIn} src={imageZoomInIcon}/>
                    <img draggable={false} className="image-control-img" onClick={() => toggleFullscreen()} src={imageFullscreenIcon}/>
                    <img draggable={false} className="image-control-img" onClick={() => navigate(`/post/${props.post?.postID}/${props.post?.slug}/reader`)} src={imageReaderIcon}/>
                </div> 
            </div>
        </div>
        <TransformWrapper disabled={disableZoom} ref={zoomRef} minScale={1} maxScale={8} onZoomStop={(ref) => setZoom(ref.state.scale)} 
        wheel={{step: 0.1, touchPadDisabled: true}} zoomAnimation={{size: 0, disabled: true}} alignmentAnimation={{disabled: true}} 
        doubleClick={{mode: "reset", animationTime: 0}} panning={{disabled: zoom === 1}}>
        <TransformComponent wrapperStyle={{pointerEvents: disableZoom ? "none" : "all"}}>
            <img draggable={false} className="post-lightness-overlay" ref={lightnessRef} src={img}/>
            <img draggable={false} className="post-sharpen-overlay" ref={overlayRef} src={img}/>
            <canvas draggable={false} className="post-effect-canvas" ref={effectRef}></canvas>
            <canvas draggable={false} className="post-pixelate-canvas" ref={pixelateRef}></canvas>
            <img draggable={false} className={`${imageExpand? "post-image-expand" : "post-image"}`} ref={imageRef} 
            src={img} onLoad={(event) => onLoaded(event)}/>
        </TransformComponent>
        </TransformWrapper>
        </>
    )
})

export default withPostWrapper(PostImage)