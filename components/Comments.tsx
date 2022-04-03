import React, {useContext, useEffect, useRef, useState} from "react"
import {ThemeContext, EnableDragContext} from "../Context"
import {HashLink as Link} from "react-router-hash-link"
import functions from "../structures/Functions"
import "./styles/comments.less"

const Comments: React.FunctionComponent = (props) => {
    const {theme, setTheme} = useContext(ThemeContext)
    const {enableDrag, setEnableDrag} = useContext(EnableDragContext)

    return (
        <div className="comments">
            <div className="comments-title">Comments</div>
            <div className="comments-text">There are no comments.</div>
            <div className="comments-input-container">
                <div className="comments-row-start" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                        <textarea className="comments-textarea" spellCheck={false}></textarea>
                </div>
                <div className="comments-button-container-left">
                    <button className="comments-button">Post</button>
                </div>
            </div>
        </div>
    )
}

export default Comments