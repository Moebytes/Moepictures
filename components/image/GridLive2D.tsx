import React, {useEffect, useState, forwardRef, useImperativeHandle} from "react"
import withGridWrapper, {GridWrapperProps, GridWrapperRef} from "./withGridWrapper"
import {useSessionSelector, useLayoutSelector} from "../../store"
import path from "path"
import {Live2DCubismModel} from "live2d-renderer"
import functions from "../../functions/Functions"

const GridLive2D = forwardRef<GridWrapperRef, GridWrapperProps>((props, parentRef) => {
    const {mobile} = useLayoutSelector()
    const {session} = useSessionSelector()
    const {imageLoaded, setImageLoaded} = props
    const {imageWidth, setImageWidth} = props
    const {imageHeight, setImageHeight} = props
    const {naturalWidth, setNaturalWidth} = props
    const {naturalHeight, setNaturalHeight} = props
    const {imageSize, setImageSize} = props
    const [screenshot, setScreenshot] = useState(props.cached ? props.img : "")
    const {live2DRef, imageRef, lightnessRef, overlayRef, effectRef, pixelateRef} = props

    useImperativeHandle(props.componentRef, () => ({
        shouldWait: async () => {
            return true
        },
        load: async () => {
            load()
        },
        update: async () => {
            await loadImage()
            if (session.liveModelPreview && !mobile) loadModel()
        }
    }))

    useImperativeHandle(parentRef, () => ({
        download: download
    }))

    const load = async () => {
        if (imageLoaded) return
        await loadImage()
        if (session.liveModelPreview && !mobile) loadModel()
    }
    
    useEffect(() => {
        props.reupdate?.()
    }, [imageSize])

    useEffect(() => {
        setImageLoaded(false)
        if (props.autoLoad) load()
    }, [props.original])

    const loadImage = async () => {
        const img = await functions.crypto.decryptThumb(props.img, session)
        setScreenshot(img)
    }

    const loadModel = async () => {
        if (!live2DRef.current) return
        const decrypted = await functions.crypto.decryptItem(props.original, session)
        live2DRef.current.width = 500
        live2DRef.current.height = 500
        const model = new Live2DCubismModel(live2DRef.current, {enablePan: true, zoomEnabled: true})
        await model.load(decrypted)
        setImageLoaded(true)
        props.onLoad?.()
    }

    const download = async () => {
        const decrypted = await functions.crypto.decryptItem(props.original, session)
        let filename = path.basename(props.original).replace(/\?.*$/, "")
        functions.dom.download(filename, decrypted)
    }

    const onLoad = (event: React.SyntheticEvent) => {
        let element = event.target as HTMLImageElement
        setImageWidth(element.width)
        setImageHeight(element.height)
        setNaturalWidth(element.naturalWidth)
        setNaturalHeight(element.naturalHeight)
        setImageLoaded(true)
        element.style.opacity = "1"
        props.onLoad?.()
    }

    return (
        <>
        <img draggable={false} className="lightness-overlay" ref={lightnessRef} src={screenshot}/>
        <img draggable={false} className="sharpen-overlay" ref={overlayRef} src={screenshot}/>

        <canvas draggable={false} className="effect-canvas" ref={effectRef}></canvas>
        <canvas draggable={false} className="pixelate-canvas" ref={pixelateRef}></canvas>

        {session.liveModelPreview && !mobile ? null : 
        <img draggable={false} className="image" ref={imageRef} src={screenshot} onLoad={(event) => onLoad(event)}/>}
        <canvas className="grid-model-renderer" ref={live2DRef} style={mobile || !session.liveModelPreview ? {display: "none"} : {opacity: "1"}}></canvas>
        </>
    )
})

export default withGridWrapper(GridLive2D)