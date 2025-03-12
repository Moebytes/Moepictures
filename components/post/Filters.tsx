import React, {useState} from "react"
import Slider from "react-slider"
import filterImage from "../../assets/icons/filter-image.png"
import filterMusic from "../../assets/icons/filter-music.png"
import brightnessIcon from "../../assets/icons/brightness.png"
import contrastIcon from "../../assets/icons/contrast.png"
import hueIcon from "../../assets/icons/hue.png"
import saturationIcon from "../../assets/icons/saturation.png"
import lightnessIcon from "../../assets/icons/lightness.png"
import blurIcon from "../../assets/icons/blur.png"
import sharpenIcon from "../../assets/icons/sharpen.png"
import pixelateIcon from "../../assets/icons/pixelate.png"
import splatterIcon from "../../assets/icons/splatter.png"
import lowpassIcon from "../../assets/icons/lowpass.png"
import highpassIcon from "../../assets/icons/highpass.png"
import reverbIcon from "../../assets/icons/reverb.png"
import delayIcon from "../../assets/icons/delay.png"
import phaserIcon from "../../assets/icons/phaser.png"
import bitcrushIcon from "../../assets/icons/bitcrush.png"
import functions from "../../structures/Functions"
import {useThemeSelector, useFilterActions, useFilterSelector, useSessionSelector, useActiveActions, useActiveSelector, useLayoutSelector} from "../../store"
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

    const getFilter = () => {
        return `hue-rotate(${siteHue - 180}deg) saturate(${siteSaturation}%) brightness(${siteLightness + 70}%)`
    }

    const imageFiltersJSX = () => {
        return (
            <>
            <div className="filter-dropdown-row filter-row">
                <img className="filter-dropdown-img" src={brightnessIcon} style={{filter: getFilter()}}/>
                <span className="filter-dropdown-text">{i18n.filters.brightness}</span>
                <Slider className="filter-slider" trackClassName="filter-slider-track" thumbClassName="filter-slider-thumb" onChange={(value) => setBrightness(value)} min={60} max={140} step={1} value={brightness}/>
            </div>
            <div className="filter-dropdown-row filter-row">
                <img className="filter-dropdown-img" src={contrastIcon} style={{marginLeft: "7px", marginRight: "-7px", filter: getFilter()}}/>
                <span className="filter-dropdown-text">{i18n.filters.contrast}</span>
                <Slider className="filter-slider" trackClassName="filter-slider-track" thumbClassName="filter-slider-thumb" onChange={(value) => setContrast(value)} min={60} max={140} step={1} value={contrast}/>
            </div>
            <div className="filter-dropdown-row filter-row">
                <img className="filter-dropdown-img" src={hueIcon} style={{marginLeft: "20px", marginRight: "-20px", filter: getFilter()}}/>
                <span className="filter-dropdown-text">{i18n.filters.hue}</span>
                <Slider className="filter-slider" trackClassName="filter-slider-track" thumbClassName="filter-slider-thumb" onChange={(value) => setHue(value)} min={150} max={210} step={1} value={hue}/>
            </div>
            <div className="filter-dropdown-row filter-row">
                <img className="filter-dropdown-img" src={saturationIcon} style={{filter: getFilter()}}/>
                <span className="filter-dropdown-text">{i18n.filters.saturation}</span>
                <Slider className="filter-slider" trackClassName="filter-slider-track" thumbClassName="filter-slider-thumb" onChange={(value) => setSaturation(value)} min={60} max={140} step={1} value={saturation}/>
            </div>
            <div className="filter-dropdown-row filter-row">
                <img className="filter-dropdown-img" src={lightnessIcon} style={{filter: getFilter()}}/>
                <span className="filter-dropdown-text">{i18n.filters.lightness}</span>
                <Slider className="filter-slider" trackClassName="filter-slider-track" thumbClassName="filter-slider-thumb" onChange={(value) => setLightness(value)} min={60} max={140} step={1} value={lightness}/>
            </div>
            <div className="filter-dropdown-row filter-row">
                <img className="filter-dropdown-img" src={blurIcon} style={{marginLeft: "20px", marginRight: "-20px", filter: getFilter()}}/>
                <span className="filter-dropdown-text">{i18n.filters.blur}</span>
                <Slider className="filter-slider" trackClassName="filter-slider-track" thumbClassName="filter-slider-thumb" onChange={(value) => setBlur(value)} min={0} max={2} step={0.1} value={blur}/>
            </div>
            <div className="filter-dropdown-row filter-row">
                <img className="filter-dropdown-img" src={sharpenIcon} style={{marginLeft: "8px", marginRight: "-8px", filter: getFilter()}}/>
                <span className="filter-dropdown-text">{i18n.filters.sharpen}</span>
                <Slider className="filter-slider" trackClassName="filter-slider-track" thumbClassName="filter-slider-thumb" onChange={(value) => setSharpen(value)} min={0} max={5} step={0.1} value={sharpen}/>
            </div>
            <div className="filter-dropdown-row filter-row">
                <img className="filter-dropdown-img" src={pixelateIcon} style={{filter: getFilter()}}/>
                <span className="filter-dropdown-text">{i18n.filters.pixelate}</span>
                <Slider className="filter-slider" trackClassName="filter-slider-track" thumbClassName="filter-slider-thumb" onChange={(value) => setPixelate(value)} min={1} max={10} step={0.1} value={pixelate}/>
            </div>
            {session.showR18 ? 
            <div className="filter-dropdown-row filter-row">
                <img className="filter-dropdown-img" src={splatterIcon} style={{filter: getFilter()}}/>
                <span className="filter-dropdown-text">{i18n.filters.splatter}</span>
                <Slider className="filter-slider" trackClassName="filter-slider-track" thumbClassName="filter-slider-thumb" onChange={(value) => setSplatter(value)} min={0} max={100} step={1} value={splatter}/>
            </div> : null}
            <div className="filter-dropdown-row filter-row">
                <button className="filter-button" onClick={() => resetImageFilters()}>{i18n.filters.reset}</button>
                <button style={{marginLeft: "20px"}} className="filter-button" onClick={() => setShowMusicFilters(!showMusicFilters)}>
                    <img src={filterImage}/>
                </button>
            </div>
            </>
        )
    }

    const musicFiltersJSX = () => {
        return (
            <>
            <div className="filter-dropdown-row filter-row">
                <img className="filter-dropdown-img" src={lowpassIcon} style={{filter: getFilter()}}/>
                <span className="audio-filter-dropdown-text">{i18n.filters.lowpass}</span>
                <Slider className="audio-filter-slider" trackClassName="audio-filter-slider-track" thumbClassName="audio-filter-slider-thumb" onChange={(value) => setLowpass(value)} min={0} max={100} step={1} value={lowpass}/>
            </div>
            <div className="filter-dropdown-row filter-row">
                <img className="filter-dropdown-img" src={highpassIcon} style={{filter: getFilter()}}/>
                <span className="audio-filter-dropdown-text">{i18n.filters.highpass}</span>
                <Slider className="audio-filter-slider" trackClassName="audio-filter-slider-track" thumbClassName="audio-filter-slider-thumb" onChange={(value) => setHighpass(value)} min={0} max={100} step={1} value={highpass}/>
            </div>
            <div className="filter-dropdown-row filter-row">
                <img className="filter-dropdown-img" src={reverbIcon} style={{filter: getFilter()}}/>
                <span className="audio-filter-dropdown-text">{i18n.filters.reverb}</span>
                <Slider className="audio-filter-slider" trackClassName="audio-filter-slider-track" thumbClassName="audio-filter-slider-thumb" onChange={(value) => setReverb(value)} min={0} max={1} step={0.01} value={reverb}/>
            </div>
            <div className="filter-dropdown-row filter-row">
                <img className="filter-dropdown-img" src={delayIcon} style={{filter: getFilter()}}/>
                <span className="audio-filter-dropdown-text">{i18n.filters.delay}</span>
                <Slider className="audio-filter-slider" trackClassName="audio-filter-slider-track" thumbClassName="audio-filter-slider-thumb" onChange={(value) => setDelay(value)} min={0} max={1} step={0.01} value={delay}/>
            </div>
            <div className="filter-dropdown-row filter-row">
                <img className="filter-dropdown-img" src={phaserIcon} style={{filter: getFilter()}}/>
                <span className="audio-filter-dropdown-text">{i18n.filters.phaser}</span>
                <Slider className="audio-filter-slider" trackClassName="audio-filter-slider-track" thumbClassName="audio-filter-slider-thumb" onChange={(value) => setPhaser(value)} min={0} max={1} step={0.01} value={phaser}/>
            </div>
            <div className="filter-dropdown-row filter-row">
                <img className="filter-dropdown-img" src={bitcrushIcon} style={{filter: getFilter()}}/>
                <span className="audio-filter-dropdown-text">{i18n.filters.bitcrush}</span>
                <Slider className="audio-filter-slider" trackClassName="audio-filter-slider-track" thumbClassName="audio-filter-slider-thumb" onChange={(value) => setBitcrush(value)} min={0} max={100} step={1} value={bitcrush}/>
            </div>
            <div className="filter-dropdown-row filter-row">
                <button className="audio-filter-button" onClick={() => resetAudioFilters()}>{i18n.filters.reset}</button>
                <button style={{marginLeft: "20px"}} className="audio-filter-button" onClick={() => setShowMusicFilters(!showMusicFilters)}>
                    <img src={filterMusic}/>
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
        if (mobile) offset += 60
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