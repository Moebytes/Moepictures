import React, {useContext, useEffect, useRef, useState} from "react"
import {ThemeContext, EnableDragContext} from "../Context"
import {HashLink as Link} from "react-router-hash-link"
import functions from "../structures/Functions"
import commentaryTranslate from "../assets/purple/commentarytranslate.png"
import commentaryTranslateMagenta from "../assets/magenta/commentarytranslate.png"
import "./styles/commentary.less"

const Commentary: React.FunctionComponent = (props) => {
    const {theme, setTheme} = useContext(ThemeContext)
    const {enableDrag, setEnableDrag} = useContext(EnableDragContext)
    const [showTranslated, setShowTranslated] = useState(false)

    const getCommentaryTranslate = () => {
        if (theme.includes("magenta")) return commentaryTranslateMagenta
        return commentaryTranslate
    }

    return (
        <div className="commentary">
            <div className="commentary-title-container">
                <div className="commentary-title">Artist's Commentary</div>
                <img className="commentary-img" src={getCommentaryTranslate()}/>
            </div>
            <div className="commentary-container" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                <span className="commentary-text">
                    This is some example commentary.     
                </span>
            </div>
        </div>
    )
}

export default Commentary