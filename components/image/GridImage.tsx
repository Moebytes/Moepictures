import React, {useEffect, useState, forwardRef, useImperativeHandle} from "react"
import withGridWrapper, {GridWrapperProps, GridWrapperRef} from "./withGridWrapper"
import {useSessionSelector, useSearchSelector, useFilterSelector} from "../../store"
import {Image} from "../../types/Types"
import functions from "../../functions/Functions"

const GridImage = forwardRef<GridWrapperRef, GridWrapperProps>((props, parentRef) => {
    const {session} = useSessionSelector()
    const {brightness, contrast, hue, saturation, lightness, blur, sharpen, pixelate, splatter} = useFilterSelector()
    const {sizeType, format} = useSearchSelector()
    const [img, setImg] = useState(props.cached ? props.img : "")
    const [imgIndex, setImgIndex] = useState(0)
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
        },
        nextImage: nextImage
    }))

    const loadImage = async () => {
        const decryptedImg = await functions.crypto.decryptThumb(props.img, session, `${props.img}-${sizeType}`)
        const bufferTest = await fetch(decryptedImg).then((r) => r.arrayBuffer())
        const result = functions.byte.bufferFileType(bufferTest)
        if (result[0]?.mime !== "application/json") {
            setImg(decryptedImg)
        } else {
            const liveImg = await functions.crypto.decryptThumb(props.live!, session, `${props.live}-${sizeType}`)
            setImg(liveImg)
        }
        setImgIndex(0)
    }

    const nextImage = async () => {
        if (props.post.images.length === 1) return
        let nextIndex = imgIndex + 1
        if (nextIndex >= props.post.images.length) nextIndex = 0
        let images = props.post.images.map((i: Image | string) => typeof i === "string" ? 
        functions.link.getRawThumbnailLink(i, sizeType) : functions.link.getThumbnailLink(i, sizeType, session))
        let img = functions.util.appendURLParams(images[nextIndex], {upscaled: false})
        const decryptedImg = await functions.crypto.decryptThumb(img, session, `${img}-${sizeType}`)
        setImg(decryptedImg)
        setImgIndex(nextIndex)
    }
        
    useEffect(() => {
        setImageLoaded(false)
        if (props.autoLoad) loadImage()
    }, [props.img])

    useEffect(() => {
        if (img) loadImage()
    }, [img, sizeType])

    return (
        <>
        <img draggable={false} className="lightness-overlay" ref={lightnessRef} src={img}/>
        <img draggable={false} className="sharpen-overlay" ref={overlayRef} src={img}/>

        <canvas draggable={false} className="effect-canvas" ref={effectRef}></canvas>
        <canvas draggable={false} className="pixelate-canvas" ref={pixelateRef}></canvas>

        <img draggable={false} className="image" ref={imageRef} src={img} fetchPriority="high"
        onLoad={(event) => onLoaded(event)} style={{opacity: "1"}}/>
        </>
    )
})

export default withGridWrapper(GridImage)