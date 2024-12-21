import React, {useEffect, useState} from "react"
import {useHistory} from "react-router-dom"
import {useThemeSelector, useSessionSelector, useLayoutSelector, useCacheSelector} from "../store"
import functions from "../structures/Functions"
import cryptoFunctions from "../structures/CryptoFunctions"
import jsxFunctions from "../structures/JSXFunctions"
import "./styles/commentcarousel.less"

interface Props {
    comments: any[]
}


const CommentCarousel: React.FunctionComponent<Props> = (props) => {
    const {i18n} = useThemeSelector()
    const {session} = useSessionSelector()
    const {mobile} = useLayoutSelector()
    const {emojis} = useCacheSelector()
    const [images, setImages] = useState([])
    const history = useHistory()

    const loadImages = async () => {
        let newImages = [] as any
        for (let i = 0; i < props.comments.length; i++) {
            let type = props.comments[i].post.images[0].type
            let img = functions.getThumbnailLink(type, props.comments[i].postID, props.comments[i].post.images[0].order, props.comments[i].post.images[0].filename, "tiny")
            const decrypted = await functions.decryptThumb(img, session)
            newImages.push(decrypted)
        }
        setImages(newImages)
    }

    useEffect(() => {
        loadImages()
    }, [props.comments, session])

    const generateJSX = () => {
        let jsx = [] as any
        for (let i = 0; i < props.comments.length; i++) {
            const imgClick = (event: React.MouseEvent) => {
                if (event.ctrlKey || event.metaKey || event.button === 1) {
                    window.open(`/post/${props.comments[i].postID}`, "_blank")
                } else {
                    history.push(`/post/${props.comments[i].postID}`)
                }
            }
            const img = images[i] ? images[i] : ""
            jsx.push(
                <div key={i} className="comment-carousel-commentrow">
                    <div className="comment-carousel-commentrow-container">
                        {functions.isVideo(img) && !mobile ? 
                        <video className="comment-carousel-commentrow-img" src={img} onClick={imgClick} onAuxClick={imgClick}></video> :
                        functions.isGIF(img) ? <img className="comment-carousel-commentrow-img" src={img} onClick={imgClick} onAuxClick={imgClick}/> :
                        <img className="comment-carousel-commentrow-img" src={img} onClick={imgClick} onAuxClick={imgClick}/>}
                    </div>
                    <div className="comment-carousel-commentrow-container-row">
                        <div className="comment-carousel-commentrow-container" style={{width: "100%"}}>
                            <span className="comment-carousel-commentrow-date-text">{functions.timeAgo(props.comments[i].postDate, i18n)}:</span>
                            {jsxFunctions.renderText(props.comments[i].comment, emojis, "commentrow")}
                        </div>
                    </div>
                </div>
            )
        }
        return jsx
    }


    return (
        <div className="comment-carousel">
            {generateJSX()}
        </div>
    )
}

export default CommentCarousel