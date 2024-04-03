import React, {useContext, useEffect, useRef, useState} from "react"
import {useHistory} from "react-router-dom"
import {ThemeContext, EnableDragContext, SessionContext} from "../Context"
import functions from "../structures/Functions"
import Carousel from "./Carousel"
import "./styles/related.less"

interface Props {
    posts: any
}

const ArtistWorks: React.FunctionComponent<Props> = (props) => {
    const {theme, setTheme} = useContext(ThemeContext)
    const {enableDrag, setEnableDrag} = useContext(EnableDragContext)
    const {session, setSession} = useContext(SessionContext)
    const history = useHistory()

    const getImages = () => {
        return props.posts.map((post: any) => functions.getThumbnailLink(post.images[0].type, post.postID, post.images[0].order, post.images[0].filename, "small"))
    }

    const click = (img: string, index: number) => {
        const postID = props.posts[index].postID
        history.push(`/post/${postID}`)
        window.scrollTo(0, 0)
    }

    if (!props.posts.length) return null

    return (
        <div className="related">
            <div className="related-title">Artist Works</div>
            <div className="related-container">
                <Carousel images={getImages()} set={click} noKey={true} marginLeft={200} height={200}/>
            </div>
        </div>
    )
}

export default ArtistWorks