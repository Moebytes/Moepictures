/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Moepictures - A cute and moe anime image board ❤          *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import React from "react"
import Slider from "react-slider"
import ImageIcon from "../assets/svg/filter-image.svg"
import MusicIcon from "../assets/svg/filter-music.svg"
import BrightnessIcon from "../assets/svg/brightness.svg"
import ContrastIcon from "../assets/svg/contrast.svg"
import HueIcon from "../assets/svg/hue.svg"
import SaturationIcon from "../assets/svg/saturation.svg"
import LightnessIcon from "../assets/svg/lightness.svg"
import BlurIcon from "../assets/svg/blur.svg"
import SharpenIcon from "../assets/svg/sharpen.svg"
import PixelateIcon from "../assets/svg/pixelate.svg"
import SplatterIcon from "../assets/svg/splatter.svg"
import LowpassIcon from "../assets/svg/lowpass.svg"
import HighpassIcon from "../assets/svg/highpass.svg"
import ReverbIcon from "../assets/svg/reverb.svg"
import DelayIcon from "../assets/svg/delay.svg"
import PhaserIcon from "../assets/svg/phaser.svg"
import BitcrushIcon from "../assets/svg/bitcrush.svg"
import functions from "../functions/Functions"
import {useThemeSelector, useFilterActions, useFilterSelector, useSessionSelector, 
useActiveActions, useActiveSelector, useLayoutSelector} from "../store"
import "./styles/filters.less"

interface Props {
    active: boolean
    right: number
    top: number
    origin?: string
    useMargin?: boolean
}

const Filters: React.FunctionComponent<Props> = (props) => {
    const {siteHue, siteSaturation, siteLightness, i18n} = useThemeSelector()
    const {session} = useSessionSelector()
    const {mobile} = useLayoutSelector()
    const {brightness, contrast, hue, saturation, lightness, blur, sharpen, pixelate, splatter,
    lowpass, highpass, reverb, delay, phaser, bitcrush} = useFilterSelector()
    const {setBrightness, setContrast, setHue, setSaturation, setLightness, setBlur, setSharpen, setPixelate, setSplatter,
    setLowpass, setHighpass, setReverb, setDelay, setPhaser, setBitcrush, resetImageFilters, resetAudioFilters} = useFilterActions()
    const {showMusicFilters} = useActiveSelector()
    const {setShowMusicFilters} = useActiveActions()

    const imageFiltersJSX = () => {
        return (
            <>
            <div className="filter-dropdown-row filter-row">
                <BrightnessIcon className="filter-dropdown-img"/>
                <span className="filter-dropdown-text">{i18n.filters.brightness}</span>
                <Slider className="filter-slider" trackClassName="filter-slider-track" thumbClassName="filter-slider-thumb" onChange={(value) => setBrightness(value)} min={60} max={140} step={1} value={brightness}/>
            </div>
            <div className="filter-dropdown-row filter-row">
                <ContrastIcon className="filter-dropdown-img" style={{marginLeft: "7px", marginRight: "-7px"}}/>
                <span className="filter-dropdown-text">{i18n.filters.contrast}</span>
                <Slider className="filter-slider" trackClassName="filter-slider-track" thumbClassName="filter-slider-thumb" onChange={(value) => setContrast(value)} min={60} max={140} step={1} value={contrast}/>
            </div>
            <div className="filter-dropdown-row filter-row">
                <HueIcon className="filter-dropdown-img" style={{marginLeft: "20px", marginRight: "-20px"}}/>
                <span className="filter-dropdown-text">{i18n.filters.hue}</span>
                <Slider className="filter-slider" trackClassName="filter-slider-track" thumbClassName="filter-slider-thumb" onChange={(value) => setHue(value)} min={150} max={210} step={1} value={hue}/>
            </div>
            <div className="filter-dropdown-row filter-row">
                <SaturationIcon className="filter-dropdown-img"/>
                <span className="filter-dropdown-text">{i18n.filters.saturation}</span>
                <Slider className="filter-slider" trackClassName="filter-slider-track" thumbClassName="filter-slider-thumb" onChange={(value) => setSaturation(value)} min={60} max={140} step={1} value={saturation}/>
            </div>
            <div className="filter-dropdown-row filter-row">
                <LightnessIcon className="filter-dropdown-img"/>
                <span className="filter-dropdown-text">{i18n.filters.lightness}</span>
                <Slider className="filter-slider" trackClassName="filter-slider-track" thumbClassName="filter-slider-thumb" onChange={(value) => setLightness(value)} min={60} max={140} step={1} value={lightness}/>
            </div>
            <div className="filter-dropdown-row filter-row">
                <BlurIcon className="filter-dropdown-img" style={{marginLeft: "20px", marginRight: "-20px"}}/>
                <span className="filter-dropdown-text">{i18n.filters.blur}</span>
                <Slider className="filter-slider" trackClassName="filter-slider-track" thumbClassName="filter-slider-thumb" onChange={(value) => setBlur(value)} min={0} max={2} step={0.1} value={blur}/>
            </div>
            <div className="filter-dropdown-row filter-row">
                <SharpenIcon className="filter-dropdown-img" style={{marginLeft: "8px", marginRight: "-8px"}}/>
                <span className="filter-dropdown-text">{i18n.filters.sharpen}</span>
                <Slider className="filter-slider" trackClassName="filter-slider-track" thumbClassName="filter-slider-thumb" onChange={(value) => setSharpen(value)} min={0} max={5} step={0.1} value={sharpen}/>
            </div>
            <div className="filter-dropdown-row filter-row">
                <PixelateIcon className="filter-dropdown-img"/>
                <span className="filter-dropdown-text">{i18n.filters.pixelate}</span>
                <Slider className="filter-slider" trackClassName="filter-slider-track" thumbClassName="filter-slider-thumb" onChange={(value) => setPixelate(value)} min={1} max={10} step={0.1} value={pixelate}/>
            </div>
            {session.showR18 ? 
            <div className="filter-dropdown-row filter-row">
                <SplatterIcon className="filter-dropdown-img"/>
                <span className="filter-dropdown-text">{i18n.filters.splatter}</span>
                <Slider className="filter-slider" trackClassName="filter-slider-track" thumbClassName="filter-slider-thumb" onChange={(value) => setSplatter(value)} min={0} max={100} step={1} value={splatter}/>
            </div> : null}
            <div className="filter-dropdown-row filter-row">
                <button className="filter-button" onClick={() => resetImageFilters()}>{i18n.filters.reset}</button>
                <button style={{marginLeft: "20px"}} className="filter-button" onClick={() => setShowMusicFilters(!showMusicFilters)}>
                    <ImageIcon className="filter-button-icon"/>
                </button>
            </div>
            </>
        )
    }

    const musicFiltersJSX = () => {
        return (
            <>
            <div className="filter-dropdown-row filter-row">
                <LowpassIcon className="filter-dropdown-img"/>
                <span className="audio-filter-dropdown-text">{i18n.filters.lowpass}</span>
                <Slider className="audio-filter-slider" trackClassName="audio-filter-slider-track" thumbClassName="audio-filter-slider-thumb" onChange={(value) => setLowpass(value)} min={0} max={100} step={1} value={lowpass}/>
            </div>
            <div className="filter-dropdown-row filter-row">
                <HighpassIcon className="filter-dropdown-img"/>
                <span className="audio-filter-dropdown-text">{i18n.filters.highpass}</span>
                <Slider className="audio-filter-slider" trackClassName="audio-filter-slider-track" thumbClassName="audio-filter-slider-thumb" onChange={(value) => setHighpass(value)} min={0} max={100} step={1} value={highpass}/>
            </div>
            <div className="filter-dropdown-row filter-row">
                <ReverbIcon className="filter-dropdown-img"/>
                <span className="audio-filter-dropdown-text">{i18n.filters.reverb}</span>
                <Slider className="audio-filter-slider" trackClassName="audio-filter-slider-track" thumbClassName="audio-filter-slider-thumb" onChange={(value) => setReverb(value)} min={0} max={1} step={0.01} value={reverb}/>
            </div>
            <div className="filter-dropdown-row filter-row">
                <DelayIcon className="filter-dropdown-img"/>
                <span className="audio-filter-dropdown-text">{i18n.filters.delay}</span>
                <Slider className="audio-filter-slider" trackClassName="audio-filter-slider-track" thumbClassName="audio-filter-slider-thumb" onChange={(value) => setDelay(value)} min={0} max={1} step={0.01} value={delay}/>
            </div>
            <div className="filter-dropdown-row filter-row">
                <PhaserIcon className="filter-dropdown-img"/>
                <span className="audio-filter-dropdown-text">{i18n.filters.phaser}</span>
                <Slider className="audio-filter-slider" trackClassName="audio-filter-slider-track" thumbClassName="audio-filter-slider-thumb" onChange={(value) => setPhaser(value)} min={0} max={1} step={0.01} value={phaser}/>
            </div>
            <div className="filter-dropdown-row filter-row">
                <BitcrushIcon className="filter-dropdown-img"/>
                <span className="audio-filter-dropdown-text">{i18n.filters.bitcrush}</span>
                <Slider className="audio-filter-slider" trackClassName="audio-filter-slider-track" thumbClassName="audio-filter-slider-thumb" onChange={(value) => setBitcrush(value)} min={0} max={100} step={1} value={bitcrush}/>
            </div>
            <div className="filter-dropdown-row filter-row">
                <button className="audio-filter-button" onClick={() => resetAudioFilters()}>{i18n.filters.reset}</button>
                <button style={{marginLeft: "20px"}} className="audio-filter-button" onClick={() => setShowMusicFilters(!showMusicFilters)}>
                    <MusicIcon className="filter-button-icon"/>
                </button>
            </div>
            </>
        )
    }

    const getMarginRight = () => {
        let raw = props.right
        let offset = 0
        if (showMusicFilters) offset += 5
        return `${raw + offset}px`
    }

    const getMarginTop = () => {
        let raw = props.top
        let offset = 0
        if (props.origin === "bottom" && showMusicFilters) offset += 100
        if (mobile) offset += props.origin === "bottom" ? 60 : 0
        return `${raw + offset}px`
    }

    return (
        <div className={`filter-dropdown ${props.active ? "" : "hide-filter-dropdown"}`} 
        style={{marginRight: getMarginRight(), marginTop: getMarginTop(), transformOrigin: props.origin === "bottom" ? "bottom" : "top"}}>
                {showMusicFilters ? musicFiltersJSX() : imageFiltersJSX()}
        </div>
    )
}

export default Filters