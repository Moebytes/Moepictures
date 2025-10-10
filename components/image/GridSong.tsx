import React, {useEffect, useState, forwardRef, useImperativeHandle} from "react"
import withGridWrapper, {GridWrapperProps, GridWrapperRef} from "./withGridWrapper"
import {useSessionSelector, useSearchSelector, usePlaybackActions} from "../../store"
import path from "path"
import functions from "../../functions/Functions"

const GridSong = forwardRef<GridWrapperRef, GridWrapperProps>((props, parentRef) => {
    const {session} = useSessionSelector()
    const {setAudio, setAudioPost, setPlayFlag, setAudioSecondsProgress, setAudioReverse, setAudioSeekTo} = usePlaybackActions()
    const {sizeType, format} = useSearchSelector()
    const [coverArt, setCoverArt] = useState(props.cached ? props.img : "")
    const [song, setSong] = useState("")
    const {imageLoaded, setImageLoaded} = props
    const {imageWidth, setImageWidth} = props
    const {imageHeight, setImageHeight} = props
    const {naturalWidth, setNaturalWidth} = props
    const {naturalHeight, setNaturalHeight} = props
    const {audioRef, lightnessRef, overlayRef, effectRef, pixelateRef} = props

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
        download: download,
        songClick: songClick
    }))

    const loadImage = async () => {
        const decrypted = await functions.crypto.decryptItem(props.original, session)
        setSong(decrypted)
        if (!coverArt) {
            const decryptedImage = await functions.crypto.decryptThumb(props.img, session, `${props.img}-${sizeType}`)
            setCoverArt(decryptedImage)
        }
    }

    useEffect(() => {
        setImageLoaded(false)
        setAudioReverse(false)
        setAudioSecondsProgress(0)
        setAudioSeekTo(null)
        if (audioRef.current) audioRef.current.style.opacity = "1"
        if (props.autoLoad) loadImage()
    }, [props.original])

    const download = async () => {
        let filename = path.basename(props.original).replace(/\?.*$/, "")
        functions.dom.download(filename, song)
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

    const songClick = (event: React.MouseEvent) => {
        event.stopPropagation()
        setAudio(song)
        setAudioPost(props.post)
        setPlayFlag("always")
    }

    return (
        <>
        <img draggable={false} className="lightness-overlay" ref={lightnessRef} src={coverArt}/>
        <img draggable={false} className="sharpen-overlay" ref={overlayRef} src={coverArt}/>

        <canvas draggable={false} className="effect-canvas" ref={effectRef}></canvas>
        <canvas draggable={false} className="pixelate-canvas" ref={pixelateRef}></canvas>

        <img draggable={false} className="image" ref={audioRef} src={coverArt} 
        onLoad={(event) => onLoad(event)} style={{opacity: "1"}}/>
        </>
    )
})

export default withGridWrapper(GridSong)