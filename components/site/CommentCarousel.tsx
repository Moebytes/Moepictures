import React, {useEffect, useState} from "react"
import {useHistory} from "react-router-dom"
import {useThemeSelector, useSessionSelector, useLayoutSelector, useCacheSelector, useSessionActions} from "../../store"
import functions from "../../structures/Functions"
import jsxFunctions from "../../structures/JSXFunctions"
import favicon from "../../assets/icons/favicon.png"
import adminCrown from "../../assets/icons/admin-crown.png"
import modCrown from "../../assets/icons/mod-crown.png"
import systemCrown from "../../assets/icons/system-crown.png"
import premiumCuratorStar from "../../assets/icons/premium-curator-star.png"
import curatorStar from "../../assets/icons/curator-star.png"
import premiumContributorPencil from "../../assets/icons/premium-contributor-pencil.png"
import contributorPencil from "../../assets/icons/contributor-pencil.png"
import premiumStar from "../../assets/icons/premium-star.png"
import EffectImage from "../image/EffectImage"
import {CommentSearch} from "../../types/Types"
import "./styles/commentcarousel.less"

interface Props {
    comments: CommentSearch[]
}


const CommentCarousel: React.FunctionComponent<Props> = (props) => {
    const {siteHue, siteSaturation, siteLightness, i18n} = useThemeSelector()
    const {session} = useSessionSelector()
    const {setSessionFlag} = useSessionActions()
    const {mobile} = useLayoutSelector()
    const {emojis} = useCacheSelector()
    const [images, setImages] = useState([] as string[])
    const history = useHistory()

    const getFilter = () => {
        return `hue-rotate(${siteHue - 180}deg) saturate(${siteSaturation}%) brightness(${siteLightness + 70}%)`
    }

    const loadImages = async () => {
        let newImages = [] as string[]
        for (let i = 0; i < props.comments.length; i++) {
            const comment = props.comments[i]
            let type = comment.post.images[0].type
            let img = functions.getThumbnailLink(type, comment.postID, comment.post.images[0].order, comment.post.images[0].filename, "tiny")
            const decrypted = await functions.decryptThumb(img, session)
            newImages.push(decrypted)
        }
        setImages(newImages)
    }

    useEffect(() => {
        loadImages()
    }, [props.comments, session])

    const generateUsernameJSX = (comment: CommentSearch) => {
        if (comment.role === "admin") {
            return (
                <div className="commentrow-username-container">
                    <span className="commentrow-user-text admin-color">{functions.toProperCase(comment.username)}</span>
                    <img className="commentrow-user-label" src={adminCrown}/>
                </div>
            )
        } else if (comment.role === "mod") {
            return (
                <div className="commentrow-username-container">
                <span className="commentrow-user-text mod-color">{functions.toProperCase(comment.username)}</span>
                    <img className="commentrow-user-label" src={modCrown}/>
                </div>
            )
        } else if (comment.role === "system") {
            return (
                <div className="commentrow-username-container">
                <span className="commentrow-user-text system-color">{functions.toProperCase(comment.username)}</span>
                    <img className="commentrow-user-label" src={systemCrown}/>
                </div>
            )
        } else if (comment.role === "premium-curator") {
            return (
                <div className="commentrow-username-container">
                <span className="commentrow-user-text curator-color">{functions.toProperCase(comment.username)}</span>
                    <img className="commentrow-user-label" src={premiumCuratorStar}/>
                </div>
            )
        } else if (comment.role === "curator") {
            return (
                <div className="commentrow-username-container">
                <span className="commentrow-user-text curator-color">{functions.toProperCase(comment.username)}</span>
                    <img className="commentrow-user-label" src={curatorStar}/>
                </div>
            )
        } else if (comment.role === "premium-contributor") {
            return (
                <div className="commentrow-username-container">
                <span className="commentrow-user-text premium-color">{functions.toProperCase(comment.username)}</span>
                    <img className="commentrow-user-label" src={premiumContributorPencil}/>
                </div>
            )
        } else if (comment.role === "contributor") {
            return (
                <div className="commentrow-username-container">
                <span className="commentrow-user-text contributor-color">{functions.toProperCase(comment.username)}</span>
                    <img className="commentrow-user-label" src={contributorPencil}/>
                </div>
            )
        } else if (comment.role === "premium") {
            return (
                <div className="commentrow-username-container">
                <span className="commentrow-user-text premium-color">{functions.toProperCase(comment.username)}</span>
                    <img className="commentrow-user-label" src={premiumStar}/>
                </div>
            )
        }
        return <span className={`commentrow-user-text ${comment.banned ? "banned" : ""}`}>{functions.toProperCase(comment.username) || i18n.user.deleted}</span>
    }

    const generateJSX = () => {
        let jsx = [] as React.ReactElement[]
        for (let i = 0; i < props.comments.length; i++) {
            const comment = props.comments[i]
            const defaultIcon = comment.image ? false : true
            const imgClick = (event: React.MouseEvent) => {
                functions.openPost(comment.post, event, history, session, setSessionFlag)
            }
            const userImgClick = (event: React.MouseEvent) => {
                if (!comment.imagePost) return
                event.stopPropagation()
                functions.openPost(comment.imagePost, event, history, session, setSessionFlag)
            }
            const userClick = (event: React.MouseEvent) => {
                if (event.ctrlKey || event.metaKey || event.button === 1) {
                    window.open(`/user/${comment.username}`, "_blank")
                } else {
                    history.push(`/user/${comment.username}`)
                }
            }
            const getCommentPFP = () => {
                if (comment.image) {
                    return functions.getTagLink("pfp", comment.image, comment.imageHash)
                } else {
                    return favicon
                }
            }
            const img = images[i] ? images[i] : ""
            jsx.push(
                <div key={i} className="comment-carousel-commentrow">
                    <div className="comment-carousel-commentrow-container">
                        <EffectImage className="commentrow-img" post={comment.post} 
                        onClick={imgClick} height={110} lineMultiplier={2} maxLineWidth={2}/>
                    </div>
                    <div className="comment-carousel-commentrow-container-row">
                        <div className="comment-carousel-commentrow-container">
                            <div className="commentrow-user-container" onClick={userClick} onAuxClick={userClick}>
                                <img className="commentrow-user-img" src={getCommentPFP()} onClick={userImgClick} onAuxClick={userImgClick} style={{filter: defaultIcon ? getFilter() : ""}}/>
                                {generateUsernameJSX(comment)}
                            </div>
                        </div>
                        <div className="comment-carousel-commentrow-container" style={{width: "100%"}}>
                            <span className="comment-carousel-commentrow-date-text">{functions.timeAgo(comment.postDate, i18n)}:</span>
                            {jsxFunctions.renderText(comment.comment, emojis, "commentrow")}
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