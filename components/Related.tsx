import React, {useContext, useEffect, useRef, useState} from "react"
import {useHistory} from "react-router-dom"
import {ThemeContext, EnableDragContext, SessionContext, PostsContext, RestrictTypeContext} from "../Context"
import {HashLink as Link} from "react-router-hash-link"
import functions from "../structures/Functions"
import permissions from "../structures/Permissions"
import GridImage from "./GridImage"
import Carousel from "./Carousel"
import axios from "axios"
import "./styles/related.less"

interface Props {
    post: any
}

const Related: React.FunctionComponent<Props> = (props) => {
    const {theme, setTheme} = useContext(ThemeContext)
    const {enableDrag, setEnableDrag} = useContext(EnableDragContext)
    const {session, setSession} = useContext(SessionContext)
    const {restrictType, setRestrictType} = useContext(RestrictTypeContext)
    const {posts, setPosts} = useContext(PostsContext)
    const [related, setRelated] = useState([]) as any
    const [images, setImages] = useState([])
    const history = useHistory()

    const updateRelated = async () => {
        let cleanPosts = posts.filter((p: any) => !p.fake)
        let related = [] as any 
        let max = 10 
        if (cleanPosts.length < max) max = cleanPosts.length
        let counter = 0
        while (counter < max) {
            const randNum = Math.floor(Math.random() * cleanPosts.length)
            const randPost = cleanPosts[randNum]
            related.push(randPost)
            cleanPosts = functions.removeItem(cleanPosts, randPost)
            console.log(cleanPosts)
            counter++
        }
        related = functions.removeDuplicates(related)
        setRelated(related)
        const images = related.map((post: any) => functions.getThumbnailLink(post.images[0].type, post.postID, post.images[0].filename, "small"))
        setImages(images)
    }

    useEffect(() => {
        updateRelated()
    }, [])

    useEffect(() => {
        updateRelated()
    }, [props.post])

    const generateImagesJSX = () => {
        let jsx = [] as any
        for (let i = 0; i < related.length; i++) {
            const post = related[i] as any
            if (post.fake) continue
            if (post.thirdParty) continue
            if (!session.username) if (post.restrict !== "safe") continue
            if (restrictType !== "explicit") if (post.restrict === "explicit") continue
            if (!permissions.isStaff(session)) if (post.restrict === "explicit") continue
            const image = post.images[0]
            if (!image) continue
            const images = post.images.map((i: any) => functions.getImageLink(i.type, post.postID, i.filename))
            jsx.push(<GridImage key={post.postID} id={post.postID} img={functions.getThumbnailLink(image.type, post.postID, image.filename, "small")} comicPages={post.type === "comic" ? images : null} post={post}/>)
        }
        return jsx
    }

    const click = (img: string, index: number) => {
        const postID = related[index].postID
        history.push(`/post/${postID}`)
        window.scrollTo(0, 0)
    }

    if (!related.length) return null

    return (
        <div className="related">
            <div className="related-title">Related</div>
            <div className="related-container">
                {/* {generateImagesJSX()} */}
                <Carousel images={images} set={click} noKey={true}/>
            </div>
        </div>
    )
}

export default Related