import React, {useContext, useRef, useState, useReducer} from "react"
import {useHistory} from "react-router-dom"
import {ThemeContext, SessionContext} from "../Context"
import functions from "../structures/Functions"
import "./styles/parent.less"
import Carousel from "./Carousel"

interface Props {
    post: any
}

const Parent: React.FunctionComponent<Props> = (props) => {
    const {theme, setTheme} = useContext(ThemeContext)
    const {session, setSession} = useContext(SessionContext)
    const history = useHistory()
    const image = functions.getThumbnailLink(props.post.post.images[0].type, props.post.parentID, props.post.post.images[0].order, props.post.post.images[0].filename, "small")

    const click = (img: string, index: number) => {
        const postID = props.post.parentID
        history.push(`/post/${postID}`)
    }

    return (
        <div className="parent">
            <div className="parent-title">Parent Post</div>
            <div className="parent-container">
                <Carousel images={[image]} set={click} noKey={true}/>
            </div>
        </div>
    )
}

export default Parent