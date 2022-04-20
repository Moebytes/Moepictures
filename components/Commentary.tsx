import React, {useContext, useEffect, useRef, useState} from "react"
import {ThemeContext, EnableDragContext} from "../Context"
import {HashLink as Link} from "react-router-hash-link"
import functions from "../structures/Functions"
import commentaryTranslate from "../assets/purple/commentarytranslate.png"
import commentaryTranslateMagenta from "../assets/magenta/commentarytranslate.png"
import axios from "axios"
import "./styles/commentary.less"

interface Props {
    text: string
    translated?: string
}

const Commentary: React.FunctionComponent<Props> = (props) => {
    const {theme, setTheme} = useContext(ThemeContext)
    const {enableDrag, setEnableDrag} = useContext(EnableDragContext)
    const [showTranslated, setShowTranslated] = useState(false)
    const [text, setText] = useState(props.text)
    const [translatedText, setTranslatedText] = useState(null)

    useEffect(() => {
        if (showTranslated) {
            if (props.translated) {
                setText(props.translated)
            } else {
                if (!translatedText) {
                    axios.post("/api/translate", [props.text], {withCredentials: true}).then((r) => {
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

    const getCommentaryTranslate = () => {
        if (theme.includes("magenta")) return commentaryTranslateMagenta
        return commentaryTranslate
    }

    return (
        <div className="commentary">
            <div className="commentary-title-container">
                <div className="commentary-title">Artist's Commentary</div>
                <img className="commentary-img" src={getCommentaryTranslate()} onClick={() => setShowTranslated((prev: boolean) => !prev)}/>
            </div>
            <div className="commentary-container" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                <span className="commentary-text">
                    {text}   
                </span>
            </div>
        </div>
    )
}

export default Commentary