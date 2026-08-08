/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Moepictures - A cute and moe anime image board ❤          *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import React, {useEffect, useState, useRef, forwardRef, useImperativeHandle, useReducer} from "react"
import {useNavigate} from "react-router-dom"
import withPostWrapper, {PostWrapperProps, PostWrapperRef} from "./withPostWrapper"
import {useSessionSelector, usePlaybackSelector, usePlaybackActions, useInteractionActions} from "../../store"
import Slider from "react-slider"
import ZoomInIcon from "../../assets/svg/zoom-in.svg"
import ZoomOutIcon from "../../assets/svg/zoom-out.svg"
import ZoomOffIcon from "../../assets/svg/zoom-off.svg"
import PlayIcon from "../../assets/svg/play.svg"
import PauseIcon from "../../assets/svg/pause.svg"
import FullscreenIcon from "../../assets/svg/fullscreen.svg"
import HalfSpeedIcon from "../../assets/svg/0.5x.svg"
import NormalSpeedIcon from "../../assets/svg/1x.svg"
import DoubleSpeedIcon from "../../assets/svg/2x.svg"
import ParameterIcon from "../../assets/svg/parameter.svg"
import PartIcon from "../../assets/svg/part.svg"
import {Live2DCubismModel} from "live2d-renderer"
import path from "path"
import functions from "../../functions/Functions"
import "./styles/postmodel.less"

const PostLive2D = forwardRef<PostWrapperRef, PostWrapperProps>((props, parentRef) => {
    const [ignored, forceUpdate] = useReducer(x => x + 1, 0)
    const {session} = useSessionSelector()
    const {disableZoom, paused} = usePlaybackSelector()
    const {setDisableZoom, setPaused} = usePlaybackActions()
    const {setEnableDrag} = useInteractionActions()
    const [showParameterDropdown, setShowParameterDropdown] = useState(false)
    const [showPartDropdown, setShowPartDropdown] = useState(false)
    const live2dControls = useRef<HTMLDivElement>(null)
    const live2dParameterRef = useRef<HTMLImageElement>(null)
    const live2dPartRef = useRef<HTMLImageElement>(null)
    const [model, setModel] = useState(null as Live2DCubismModel | null)
    const [modelWidth, setModelWidth] = useState(0)
    const [modelHeight, setModelHeight] = useState(0)
    const [modelSpeed, setModelSpeed] = useState(1)
    const [live2d, setLive2D] = useState("")
    const {toggleFullscreen} = props
    const {live2DRef, lightnessRef, overlayRef, effectRef, pixelateRef, onLoaded} = props
    const navigate = useNavigate()

    useEffect(() => {
        const savedSpeed = localStorage.getItem("live2dSpeed")
        if (savedSpeed) setModelSpeed(Number(savedSpeed))
        setPaused(false)
    }, [])

    useEffect(() => {
        localStorage.setItem("live2dSpeed", String(modelSpeed))
    }, [modelSpeed])

    useImperativeHandle(parentRef, () => ({
        download: download
    }))

    const decryptLive2D = async () => {
        if (!props.live2d) return
        const decryptedLive2D = await functions.crypto.decryptItem(props.live2d, session)
        if (decryptedLive2D) setLive2D(decryptedLive2D)
    }

    useEffect(() => {
        setModel(null)
    }, [props.live2d])

    useEffect(() => {
        decryptLive2D()
    }, [props.live2d, session])

    useEffect(() => {
        if (live2d) loadLive2DModel()
    }, [live2d])

    const loadLive2DModel = async () => {
        if (!live2d || !live2DRef.current) return

        live2DRef.current.width = 700
        live2DRef.current.height = 700
        const model = new Live2DCubismModel(live2DRef.current)
        await model.load(live2d)

        setModel(model)
        setModelWidth(model.width)
        setModelHeight(model.height)
    }

    useEffect(() => {
        if (!model || !live2DRef.current) return

        model.paused = paused
        model.zoomEnabled = !disableZoom
        model.speed = modelSpeed
    }, [model, disableZoom, paused, modelSpeed])

    const getParameterMarginRight = () => {
        const controlRect = live2dControls.current?.getBoundingClientRect()
        const rect = live2dParameterRef.current?.getBoundingClientRect()
        if (!rect || !controlRect) return "400px"
        const raw = controlRect.right - rect.right
        let offset = -200
        return `${raw + offset}px`
    }

    const getPartMarginRight = () => {
        const controlRect = live2dControls.current?.getBoundingClientRect()
        const rect = live2dPartRef.current?.getBoundingClientRect()
        if (!rect || !controlRect) return "400px"
        const raw = controlRect.right - rect.right
        let offset = -130
        return `${raw + offset}px`
    }

    const download = async () => {
        let filename = path.basename(props.live2d!).replace(/\?.*$/, "")
        functions.dom.download(filename, live2d)
    }

    const closeDropdowns = () => {
        setShowParameterDropdown(false)
        setShowPartDropdown(false)
    }

    const toggleDropdown = (dropdown: string) => {
        if (dropdown === "parameter") {
            if (showParameterDropdown) {
                setShowParameterDropdown(false)
            } else {
                closeDropdowns()
                setShowParameterDropdown(true)
            }
        }
        if (dropdown === "part") {
            if (showPartDropdown) {
                setShowPartDropdown(false)
            } else {
                closeDropdowns()
                setShowPartDropdown(true)
            }
        }
    }

    useEffect(() => {
        if (showParameterDropdown || showPartDropdown) {
            const loop = () => {
                forceUpdate()
                setTimeout(() => {
                    loop()
                }, 5)
            }
            loop()
        }
    }, [showParameterDropdown, showPartDropdown])

    const controlMouseEnter = () => {
        if (live2dControls.current) live2dControls.current.style.opacity = "1"
    }

    const controlMouseLeave = () => {
        setShowParameterDropdown(false)
        setShowPartDropdown(false)
        if (live2dControls.current) live2dControls.current.style.opacity = "0"
    }

    const changeFPS = () => {
        if (modelSpeed === 0.5) return setModelSpeed(1)
        if (modelSpeed === 1) return setModelSpeed(2)
        if (modelSpeed === 2) return setModelSpeed(0.5)
        return setModelSpeed(1)
    }

    const zoomIn = () => {
        if (disableZoom) return
        model?.zoomIn()
    }

    const zoomOut = () => {
        if (disableZoom) return
        model?.zoomOut()
    }

    const parameterDropdownJSX = () => {
        if (!model) return null
        let jsx = [] as React.ReactElement[]

        let parameters = model.parameters
        const resetParameters = () => {
            model.resetParameters()
            forceUpdate()
        }

        for (let i = 0; i < parameters.ids.length; i++) {
            const id = parameters.ids[i]
            const value = parameters.values[i]
            const defaultValue = parameters.defaultValues[i]
            const min = parameters.minimumValues[i]
            const max = parameters.maximumValues[i]
            const keys = parameters.keyValues[i]
            const step = (Math.abs(max - min) / 100) || 0.01
            const updateParameter = (value: number) => {
                model.setParameter(id, value)
                forceUpdate()
            }
            jsx.push(
                <div className="live2d-dropdown-row live2d-row">
                    <span className="live2d-dropdown-text">{id}</span>
                    <Slider className="live2d-slider" trackClassName="live2d-slider-track" thumbClassName="live2d-slider-thumb" 
                    onChange={(value) => updateParameter(value)} min={min} max={max} step={step} value={value}/>
                </div>
            )
        }

        return (
            <div className={`live2d-dropdown ${showParameterDropdown ? "" : "hide-live2d-dropdown"}`}
            style={{marginRight: getParameterMarginRight(), top: `-300px`}}>
                <div className="live2d-dropdown-container">
                    {jsx}
                    <div className="live2d-dropdown-row live2d-row">
                        <button className="live2d-button" onClick={() => resetParameters()}>Reset</button>
                    </div>
                </div>
            </div>
        )
    }

    const partDropdownJSX = () => {
        if (!model) return null
        let jsx = [] as React.ReactElement[]

        let parts = model.parts

        const resetParts = () => {
            model.resetPartOpacities()
            forceUpdate()
        }

        for (let i = 0; i < parts.ids.length; i++) {
            const id = parts.ids[i]
            const opacity = parts.opacities[i]
            const updatePart = (value: number) => {
                model.setPartOpacity(id, value)
                forceUpdate()
            }
            jsx.push(
                <div className="live2d-dropdown-row live2d-row">
                    <span className="live2d-dropdown-text">{id}</span>
                    <Slider className="live2d-slider" trackClassName="live2d-slider-track" thumbClassName="live2d-slider-thumb" 
                    onChange={(value) => updatePart(value)} min={0} max={1} step={0.01} value={opacity}/>
                </div>
            )
        }

        return (
            <div className={`live2d-dropdown ${showPartDropdown ? "" : "hide-live2d-dropdown"}`}
            style={{marginRight: getPartMarginRight(), top: `-300px`}}>
                <div className="live2d-dropdown-container">
                    {jsx}
                    <div className="live2d-dropdown-row live2d-row">
                        <button className="live2d-button" onClick={() => resetParts()}>Reset</button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <>
        <div className="image-controls" ref={live2dControls} onMouseOver={controlMouseEnter} onMouseLeave={controlMouseLeave}>
            <div className="image-control-row" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                <div className="image-control-row-container">
                    {disableZoom ?
                    <ZoomOffIcon className="image-control-img-red" onClick={() => setDisableZoom(!disableZoom)}/> :
                    <ZoomOffIcon className="image-control-img-orange" onClick={() => setDisableZoom(!disableZoom)}/>}
                    <ZoomOutIcon className="image-control-img-orange" onClick={zoomOut}/>
                    <ZoomInIcon className="image-control-img-orange" onClick={zoomIn}/>
                    {paused ?
                    <PlayIcon className="image-control-img-orange" onClick={() => setPaused(!paused)}/> :
                    <PauseIcon className="image-control-img-orange" onClick={() => setPaused(!paused)}/>}
                    {modelSpeed === 2 ?
                    <DoubleSpeedIcon className="image-control-img-orange" onClick={() => changeFPS()}/> :
                    modelSpeed === 1 ? 
                    <NormalSpeedIcon className="image-control-img-orange" onClick={() => changeFPS()}/> :
                    <HalfSpeedIcon className="image-control-img-orange" onClick={() => changeFPS()}/>}
                    <ParameterIcon className="image-control-img-orange" ref={live2dParameterRef} onClick={() => toggleDropdown("parameter")}/>
                    <PartIcon className="image-control-img-orange" ref={live2dPartRef} onClick={() => toggleDropdown("part")}/>
                    <FullscreenIcon className="image-control-img-orange" ref={live2dPartRef} onClick={() => toggleFullscreen()}/>
                </div> 
            </div>
            {parameterDropdownJSX()}
            {partDropdownJSX()}
        </div>
        <img draggable={false} className="post-lightness-overlay" ref={lightnessRef}/>
        <img draggable={false} className="post-sharpen-overlay" ref={overlayRef}/>
        <canvas draggable={false} className="post-effect-canvas" ref={effectRef}></canvas>
        <canvas draggable={false} className="post-pixelate-canvas" ref={pixelateRef}></canvas>
        <canvas draggable={false} className="post-model-renderer" ref={live2DRef}></canvas>
        </>
    )
})

export default withPostWrapper(PostLive2D)