import React, {useEffect, useState, forwardRef, useImperativeHandle} from "react"
import withGridWrapper, {GridWrapperProps, GridWrapperRef} from "./withGridWrapper"
import {useSessionSelector, useSearchSelector, useFilterSelector} from "../../store"
import JSZip from "jszip"
import path from "path"
import functions from "../../functions/Functions"

const GridImage = forwardRef<GridWrapperRef, GridWrapperProps>((props, parentRef) => {
    const {session} = useSessionSelector()
    const {brightness, contrast, hue, saturation, lightness, blur, sharpen, pixelate, splatter} = useFilterSelector()
    const {sizeType, format} = useSearchSelector()
    const [img, setImg] = useState(props.cached ? props.img : "")
    const {imageLoaded, setImageLoaded} = props
    const {imageRef, lightnessRef, overlayRef, effectRef, pixelateRef, onLoaded} = props

    useImperativeHandle(props.componentRef, () => ({
        shouldWait: async () => {
            return false
        },
        load: async () => {
            loadImage()
        },
        update: async () => {}
    }))

    useImperativeHandle(parentRef, () => ({
        download: async () => {
            return functions.image.download(props.img, imageRef.current!, props.post!, format, session, 
            {brightness, contrast, hue, blur, lightness, pixelate, saturation, sharpen, splatter}, 
            props.comicPages)
        }
    }))

    const loadImage = async () => {
        const decryptedImg = await functions.crypto.decryptThumb(props.img, session, `${props.img}-${sizeType}`)
        setImg(decryptedImg)
    }
        
    useEffect(() => {
        setImageLoaded(false)
        if (props.autoLoad) loadImage()
    }, [props.img])

    return (
        <>
        <img draggable={false} className="lightness-overlay" ref={lightnessRef} src={img}/>
        <img draggable={false} className="sharpen-overlay" ref={overlayRef} src={img}/>

        <canvas draggable={false} className="effect-canvas" ref={effectRef}></canvas>
        <canvas draggable={false} className="pixelate-canvas" ref={pixelateRef}></canvas>

        <img draggable={false} className="image" ref={imageRef} src={img} 
        onLoad={(event) => onLoaded(event)} style={{opacity: "1"}}/>
        </>
    )
})

export default withGridWrapper(GridImage)