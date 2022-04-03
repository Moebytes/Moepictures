import React, {useContext, useEffect, useRef, useState} from "react"
import {ThemeContext} from "../Context"
import {HashLink as Link} from "react-router-hash-link"
import functions from "../structures/Functions"
import img1 from "../assets/images/img2.jpg"
import quote from "../assets/purple/commentquote.png"
import report from "../assets/purple/commentreport.png"
import commentorImg from "../assets/images/commentor.png"
import "./styles/commentrow.less"

const CommentRow: React.FunctionComponent = (props) => {
    const {theme, setTheme} = useContext(ThemeContext)
    const [hover, setHover] = useState(false)


    return (
        <div className="commentrow" onMouseEnter={() =>setHover(true)} onMouseLeave={() => setHover(false)}>
            <div className="commentrow-container">
                <img className="commentrow-img" src={img1}/>
            </div>
            <div className="commentrow-container">
                <div className="commentrow-user-container">
                    <img className="commentrow-user-img" src={commentorImg}/>
                    <span className="commentrow-user-text">Abraxis</span>
                </div>
            </div>
            <div className="commentrow-container" style={{width: "100%"}}>
                <span className="commentrow-date-text">4 months ago:</span>
                <span className="commentrow-text">Insert some dumb text</span>
            </div>
            <div className="commentrow-options">
                <div className="commentrow-options-container">
                    <img className="commentrow-options-img" src={quote}/>
                    <span className="commentrow-options-text">Quote</span>
                </div>
                <div className="commentrow-options-container">
                    <img className="commentrow-options-img" src={report}/>
                    <span className="commentrow-options-text">Report</span>
                </div>
            </div>
        </div>
    )
}

export default CommentRow