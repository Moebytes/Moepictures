import React, {useEffect, useState} from "react"
import {useInteractionActions, useThemeSelector, useSessionSelector, useSessionActions} from "../store"
import jsxFunctions from "../structures/JSXFunctions"
import commentaryTranslate from "../assets/icons/commentarytranslate.png"
import functions from "../structures/Functions"
import "./styles/commentary.less"

interface Props {
    text: string
    translated?: string
}

const Commentary: React.FunctionComponent<Props> = (props) => {
    const {siteHue, siteSaturation, siteLightness} = useThemeSelector()
    const {setEnableDrag} = useInteractionActions()
    const {session} = useSessionSelector()
    const {setSessionFlag} = useSessionActions()
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
                    functions.post("/api/misc/translate", [props.text], session, setSessionFlag).then((r) => {
                        setTranslatedText(r[0])
                        setText(r[0])
                    })
                } else {
                    setText(translatedText)
                }
            }
        } else {
            setText(props.text)
        }
    }, [showTranslated, session])

    return (
        <div className="commentary">
            <div className="commentary-title-container">
                <div className="commentary-title">Artist Commentary</div>
                <img className="commentary-img" src={commentaryTranslate} style={{filter: getFilter()}} onClick={() => setShowTranslated((prev: boolean) => !prev)}/>
            </div>
            <div className="commentary-container" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                <span className="commentary-text">
                    {jsxFunctions.renderCommentaryText(text)}   
                </span>
            </div>
        </div>
    )
}

export default Commentary