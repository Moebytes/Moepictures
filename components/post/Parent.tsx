import React from "react"
import {useNavigate} from "react-router-dom"
import functions from "../../functions/Functions"
import {useLayoutSelector, useSessionSelector, useThemeSelector, useFlagActions} from "../../store"
import "./styles/parent.less"
import Carousel from "../site/Carousel"
import {ChildPost} from "../../types/Types"

interface Props {
    post: ChildPost
}

const Parent: React.FunctionComponent<Props> = (props) => {
    const {i18n} = useThemeSelector()
    const {session} = useSessionSelector()
    const {mobile} = useLayoutSelector()
    const {setPostFlag} = useFlagActions()
    const navigate = useNavigate()
    const post = props.post.post
    const image = functions.link.getThumbnailLink(post.images[0], "tiny", session, mobile)

    const click = (img: string, index: number) => {
        navigate(`/post/${post.postID}/${post.slug}`, {replace: true})
        setPostFlag(post.postID)
    }

    return (
        <div className="parent">
            <div className="parent-title">{i18n.post.parentPost}</div>
            <div className="parent-container">
                <Carousel images={[image]} set={click} noKey={true}/>
            </div>
        </div>
    )
}

export default Parent