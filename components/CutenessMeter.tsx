import React, {useContext, useEffect, useRef, useState, useReducer} from "react"
import {ThemeContext, SessionContext, SiteHueContext, SiteLightnessContext, SiteSaturationContext} from "../Context"
import Slider from "react-slider"
import {Rating} from "react-simple-star-rating"
import functions from "../structures/Functions"
import cuteness1 from "../assets/misc/cuteness1.png"
import cuteness2 from "../assets/misc/cuteness2.png"
import cuteness3 from "../assets/misc/cuteness3.png"
import cuteness4 from "../assets/misc/cuteness4.png"
import cuteness5 from "../assets/misc/cuteness5.png"
import deleteStar from "../assets/icons/deletestar.png"
import "./styles/cutenessmeter.less"
import axios from "axios"

interface Props {
    post: any
}

let cutenessTimer = null as any

const CutenessMeter: React.FunctionComponent<Props> = (props) => {
    const {theme, setTheme} = useContext(ThemeContext)
    const {siteHue, setSiteHue} = useContext(SiteHueContext)
    const {siteSaturation, setSiteSaturation} = useContext(SiteSaturationContext)
    const {siteLightness, setSiteLightness} = useContext(SiteLightnessContext)
    const {session, setSession} = useContext(SessionContext)
    const [cuteness, setCuteness] = useState(0)
    const [averageCuteness, setAverageCuteness] = useState(props.post?.cuteness || 0)
    const [isAverage, setIsAverage] = useState(false)
    const sliderRef = useRef<any>(null)
    useEffect(() => sliderRef.current ? sliderRef.current.resize() : null)

    const getFilter = () => {
        return `hue-rotate(${siteHue - 180}deg) saturate(${siteSaturation}%) brightness(${siteLightness + 70}%)`
    }

    const getFilter2 = () => {
        let hue = siteHue - 180
        if (isAverage) hue += 10
        return `hue-rotate(${hue}deg) saturate(${siteSaturation}%) brightness(${siteLightness + 70}%)`
    }

    const getCuteness = async () => {
        const cuteness = await axios.get("/api/cuteness", {params: {postID: props.post.postID}, withCredentials: true}).then((r) => r.data)
        if (props.post?.cuteness) setAverageCuteness(props.post.cuteness)
        if (cuteness?.cuteness) {
            setCuteness(Number(cuteness.cuteness))
            setIsAverage(false)
        } else {
            setIsAverage(true)
        }
    }

    const updateCuteness = async () => {
        await axios.post("/api/cuteness/update", {cuteness, postID: props.post.postID}, {headers: {"x-csrf-token": functions.getCSRFToken()}, withCredentials: true})
        if (cuteness) setIsAverage(false)
    }

    const deleteRating = async () => {
        await axios.delete("/api/cuteness/delete", {params: {postID: props.post.postID}, headers: {"x-csrf-token": functions.getCSRFToken()}, withCredentials: true})
        // setCuteness(0)
        setIsAverage(true)
    }

    useEffect(() => {
        getCuteness()
    }, [props.post])

    const getImg = () => {
        if (cuteness < 200) {
            return cuteness1
        } else if (cuteness >= 200 && cuteness < 400) {
            return cuteness2
        } else if (cuteness >= 400 && cuteness < 600) {
            return cuteness3
        } else if (cuteness >= 600 && cuteness < 800) {
            return cuteness4
        } else if (cuteness >= 800) {
            return cuteness5
        }
    }

    useEffect(() => {
        // const thumb = document.querySelector(".cuteness-thumb") as any
        // if (!thumb) return 
        // thumb.style.backgroundImage = `url(${getImg()})`
        clearTimeout(cutenessTimer)
        cutenessTimer = setTimeout(() => {
            updateCuteness()
        }, 500)
    }, [cuteness])

    const setCutenessValue = (value: number) => {
        if (isAverage) return setCuteness(averageCuteness)
        return setCuteness(value)
    }

    const getCutenessValue = () => {
        console.log(cuteness)
        if (isAverage) return averageCuteness
        return cuteness
    }

    return (
        <div className="cuteness-meter">
            <div className="cuteness-title-container">
                <div className="cuteness-title">Cuteness</div>
                <img className="cuteness-img" src={deleteStar} style={{filter: getFilter()}} onClick={deleteRating}/>
            </div>
            <div className="cuteness-slider-container" style={{filter: getFilter2()}}>
                <Rating style={{fontSize: 0}} onClick={setCutenessValue} initialValue={getCutenessValue()} allowFraction={true} fullFraction={true} 
                allowTitleTag={false} multiplier={200} showTooltip={true} tooltipClassName="cuteness-tooltip" tooltipDefaultText={`${averageCuteness}`}
                iconsCount={5} size={80} snap={2} SVGstrokeColor="black" SVGstorkeWidth={1} fillColor="#4b22f0" emptyColor="black"/>
                {/* <Slider ref={sliderRef} renderTrack={(props, state) => <div {...props} className={`cuteness-track-${state.index}`}><span className="cuteness-text">{state.value}</span></div>} className="cuteness-slider" thumbClassName="cuteness-thumb" onChange={(value) => setCuteness(value)} min={0} max={1000} step={1} value={cuteness}/> */}
            </div>
        </div>
    )
}

export default CutenessMeter