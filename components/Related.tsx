import React, {useContext, useEffect, useRef, useState} from "react"
import {useHistory} from "react-router-dom"
import {ThemeContext, EnableDragContext, SessionContext, MobileContext, RestrictTypeContext} from "../Context"
import {HashLink as Link} from "react-router-hash-link"
import functions from "../structures/Functions"
import permissions from "../structures/Permissions"
import GridImage from "./GridImage"
import Carousel from "./Carousel"
import axios from "axios"
import "./styles/related.less"

interface Props {
    related: any
}

const Related: React.FunctionComponent<Props> = (props) => {
    const {mobile, setMobile} = useContext(MobileContext)
    const {theme, setTheme} = useContext(ThemeContext)
    const {enableDrag, setEnableDrag} = useContext(EnableDragContext)
    const {session, setSession} = useContext(SessionContext)
    const {restrictType, setRestrictType} = useContext(RestrictTypeContext)
    const [related, setRelated] = useState([]) as any
    const history = useHistory()

    const generateImagesJSX = () => {
        let jsx = [] as any
        // props.related.length
        for (let i = 0; i < 12; i++) {
            const post = props.related[i] as any
            if (!post) break
            if (post.fake) continue
            if (post.thirdParty) continue
            if (!session.username) if (post.restrict !== "safe") continue
            if (restrictType !== "explicit") if (post.restrict === "explicit") continue
            if (!permissions.isElevated(session)) if (post.restrict === "explicit") continue
            const image = post.images[0]
            if (!image) continue
            const images = post.images.map((i: any) => functions.getImageLink(i.type, post.postID, i.order, i.filename))
            jsx.push(<GridImage square={true} marginBottom={30} key={post.postID} id={post.postID} img={functions.getThumbnailLink(image.type, post.postID, image.order, image.filename, "medium")} comicPages={post.type === "comic" ? images : null} post={post}/>)
        }
        return jsx
    }

    const updateRelated = () => {
        setRelated(functions.shuffleArray(props.related).slice(0, 30))
    }

    useEffect(() => {
        updateRelated()
    }, [props.related])


    const getImages = () => {
        return related.map((post: any) => functions.getThumbnailLink(post.images[0].type, post.postID, post.images[0].order, post.images[0].filename, "medium"))
    }

    const click = (img: string, index: number) => {
        const postID = related[index].postID
        history.push(`/post/${postID}`)
        window.scrollTo(0, 0)
    }

    let marginLeft = mobile ? 20 : 200

    if (!related.length) return null

    return (
        <div className="related" style={{paddingLeft: `${marginLeft}px`, marginBottom: "10px"}}>
            <div className="related-title" style={{marginBottom: "0px"}}>Related</div>
            <div className="related-container">
                {/* {generateImagesJSX()} */}
                <Carousel images={getImages()} set={click} noKey={true} marginLeft={marginLeft} height={200}/>
            </div>
        </div>
    )
}

export default Related