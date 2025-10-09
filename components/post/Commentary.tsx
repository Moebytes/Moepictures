import React, {useEffect, useState} from "react"
import {useInteractionActions, useThemeSelector, useSessionSelector, useSessionActions} from "../../store"
import commentaryTranslate from "../../assets/icons/commentarytranslate.png"
import functions from "../../functions/Functions"
import "./styles/commentary.less"

interface Props {
    text: string
    translated?: string
}

const Commentary: React.FunctionComponent<Props> = (props) => {
    const {siteHue, siteSaturation, siteLightness, language, i18n} = useThemeSelector()
    const {setEnableDrag} = useInteractionActions()
    const {session} = useSessionSelector()
    const {setSessionFlag} = useSessionActions()
    const [showTranslated, setShowTranslated] = useState(false)
    const [text, setText] = useState(props.text)
    const [translatedText, setTranslatedText] = useState("")

    const getFilter = () => {
        return `hue-rotate(${siteHue - 180}deg) saturate(${siteSaturation}%) brightness(${siteLightness + 70}%)`
    }

    useEffect(() => {
        if (language === "ja") {
            setShowTranslated(false)
        } else {
            setShowTranslated(true)
        }
    }, [language])

    useEffect(() => {
        if (showTranslated) {
            if (props.translated) {
                setText(props.translated)
            } else {
                if (!translatedText) {
                    functions.http.post("/api/misc/translate", [props.text], session, setSessionFlag).then((r) => {
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
                <div className="commentary-title">{i18n.post.commentary}</div>
                <img className="commentary-img" src={commentaryTranslate} style={{filter: getFilter()}} onClick={() => setShowTranslated((prev: boolean) => !prev)}/>
            </div>
            <div className="commentary-container" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                <span className="commentary-text">
                    {functions.jsx.renderCommentaryText(text)}   
                </span>
            </div>
        </div>
    )
}

export default Commentary