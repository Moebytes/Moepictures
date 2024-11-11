import React, {useContext, useRef, useState} from "react"
import {useHistory} from "react-router-dom"
import {EnableDragContext, SessionContext, MobileContext, PostsContext} from "../Context"
import functions from "../structures/Functions"
import Carousel from "./Carousel"
import "./styles/related.less"

interface Props {
    posts: any
}

const ArtistWorks: React.FunctionComponent<Props> = (props) => {
    const {mobile, setMobile} = useContext(MobileContext)
    const {enableDrag, setEnableDrag} = useContext(EnableDragContext)
    const {session, setSession} = useContext(SessionContext)
    const {posts, setPosts} = useContext(PostsContext)
    const history = useHistory()

    const getImages = () => {
        return props.posts.map((post: any) => functions.getThumbnailLink(post.images[0].type, post.postID, post.images[0].order, post.images[0].filename, "small"))
    }

    const click = (img: string, index: number) => {
        const post = props.posts[index]
        history.push(`/post/${post.postID}/${post.slug}`)
        window.scrollTo(0, functions.navbarHeight() + functions.titlebarHeight())
        setPosts(props.posts)
    }

    let marginLeft = mobile ? 20 : 200

    if (!props.posts.length) return null

    return (
        <div className="related">
            <div className="related-title">Artist Works</div>
            <div className="related-container">
                <Carousel images={getImages()} set={click} noKey={true} marginLeft={marginLeft} height={200}/>
            </div>
        </div>
    )
}

export default ArtistWorks