import React, {useContext, useEffect, useRef, useState, useReducer} from "react"
import {ThemeContext, SessionContext} from "../Context"
import Slider from "react-slider"
import {HashLink as Link} from "react-router-hash-link"
import functions from "../structures/Functions"
import cuteness1 from "../assets/misc/cuteness1.png"
import cuteness2 from "../assets/misc/cuteness2.png"
import cuteness3 from "../assets/misc/cuteness3.png"
import cuteness4 from "../assets/misc/cuteness4.png"
import cuteness5 from "../assets/misc/cuteness5.png"
import "./styles/cutenessmeter.less"
import axios from "axios"

interface Props {
    post: any
}

let cutenessTimer = null as any

const CutenessMeter: React.FunctionComponent<Props> = (props) => {
    const {theme, setTheme} = useContext(ThemeContext)
    const {session, setSession} = useContext(SessionContext)
    const [cuteness, setCuteness] = useState(500)
    const sliderRef = useRef<any>(null)
    useEffect(() => sliderRef.current ? sliderRef.current.resize() : null)

    const getCuteness = async () => {
        const cuteness = await axios.get("/api/cuteness", {params: {postID: props.post.postID}, withCredentials: true}).then((r) => r.data)
        if (cuteness) setCuteness(Number(cuteness.cuteness))
    }

    const updateCuteness = async () => {
        await axios.post("/api/cuteness", {cuteness, postID: props.post.postID}, {withCredentials: true})
    }

    useEffect(() => {
        getCuteness()
    }, [])

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
        const thumb = document.querySelector(".cuteness-thumb") as any
        if (!thumb) return 
        thumb.style.backgroundImage = `url(${getImg()})`
        clearTimeout(cutenessTimer)
        cutenessTimer = setTimeout(() => {
            updateCuteness()
        }, 500)
    }, [cuteness])

    return (
        <div className="cuteness-meter">
            <div className="cuteness-title">Cuteness Meter</div>
            <div className="cuteness-slider-container">
                <Slider ref={sliderRef} renderTrack={(props, state) => <div {...props} className={`cuteness-track-${state.index}`}><span className="cuteness-text">{state.value}</span></div>} className="cuteness-slider" thumbClassName="cuteness-thumb" onChange={(value) => setCuteness(value)} min={0} max={1000} step={1} value={cuteness}/>
            </div>
        </div>
    )
}

export default CutenessMeter