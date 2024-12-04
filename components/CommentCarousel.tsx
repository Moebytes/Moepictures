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

    const parseText = (comment: string) => {
        const pieces = functions.parseComment(comment)
        let jsx = [] as any
        for (let i = 0; i < pieces.length; i++) {
            const piece = pieces[i]
            if (piece.includes(">")) {
                const userPart = piece.match(/(>>>)(.*?)(?=$|>)/gm)?.[0].replace(">>>", "") ?? ""
                let username = ""
                let said = ""
                if (userPart) {
                    username = functions.toProperCase(userPart.split(/ +/g)[0])
                    said = userPart.split(/ +/g).slice(1).join(" ")
                }
                const text = piece.replace(userPart, "").replaceAll(">", "")
                jsx.push(
                    <div className="comment-carousel-commentrow-quote-container">
                        {userPart ? <span className="comment-carousel-commentrow-quote-user">{`${username.trim()} ${said.trim()}`}</span> : null}
                        <span className="comment-carousel-commentrow-quote-text">{jsxFunctions.renderCommentText(text.trim(), emojis)}</span>
                    </div>
                )
            } else {
                jsx.push(<span className="comment-carousel-commentrow-text">{jsxFunctions.renderCommentText(piece.trim(), emojis)}</span>)
            }
        }
        return jsx
    }

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
                            {parseText(props.comments[i].comment)}
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