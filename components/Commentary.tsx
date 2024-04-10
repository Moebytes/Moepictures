import React, {useContext, useEffect, useRef, useState} from "react"
import {ThemeContext, EnableDragContext, SiteHueContext, SiteLightnessContext, SiteSaturationContext} from "../Context"
import {HashLink as Link} from "react-router-hash-link"
import functions from "../structures/Functions"
import commentaryTranslate from "../assets/icons/commentarytranslate.png"
import axios from "axios"
import "./styles/commentary.less"

interface Props {
    text: string
    translated?: string
}

const Commentary: React.FunctionComponent<Props> = (props) => {
    const {theme, setTheme} = useContext(ThemeContext)
    const {siteHue, setSiteHue} = useContext(SiteHueContext)
    const {siteSaturation, setSiteSaturation} = useContext(SiteSaturationContext)
    const {siteLightness, setSiteLightness} = useContext(SiteLightnessContext)
    const {enableDrag, setEnableDrag} = useContext(EnableDragContext)
    const [showTranslated, setShowTranslated] = useState(false)
    const [text, setText] = useState(props.text)
    const [translatedText, setTranslatedText] = useState(null)

    const getFilter = () => {
        return `hue-rotate(${siteHue - 180}deg) saturate(${siteSaturation}%) brightness(${siteLightness + 70}%)`
    }

    useEffect(() => {
        setText(props.text)
    }, [props.text])

    useEffect(() => {
        if (showTranslated) {
            if (props.translated) {
                setText(props.translated)
            } else {
                if (!translatedText) {
                    axios.post("/api/misc/translate", [props.text], {withCredentials: true}).then((r) => {
                        setTranslatedText(r.data[0])
                        setText(r.data[0])
                    })
                } else {
                    setText(translatedText)
                }
            }
        } else {
            setText(props.text)
        }
    }, [showTranslated])

    const parseText = () => {
        const parts = text.split(/(https?:\/\/[^\s]+)/g)
        const elements = parts.map((part, index) => {
            if (part.match(/(https?:\/\/[^\s]+)/g)) {
                return (<a key={index} href={part} target="_blank" rel="noopener">{part}</a>)
            } else {
                return <span key={index}>{part}</span>
            }
        })
        return elements
    }

    return (
        <div className="commentary">
            <div className="commentary-title-container">
                <div className="commentary-title">Artist Commentary</div>
                <img className="commentary-img" src={commentaryTranslate} style={{filter: getFilter()}} onClick={() => setShowTranslated((prev: boolean) => !prev)}/>
            </div>
            <div className="commentary-container" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                <span className="commentary-text">
                    {parseText()}   
                </span>
            </div>
        </div>
    )
}

export default Commentary