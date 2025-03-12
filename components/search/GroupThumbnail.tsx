import React, {useEffect, useState, useRef} from "react"
import {useNavigate} from "react-router-dom"
import {useSessionSelector, useLayoutSelector, useFilterSelector} from "../../store"
import functions from "../../structures/Functions"
import EffectImage from "../image/EffectImage"
import {GroupSearch, GroupPosts} from "../../types/Types"
import "./styles/groupthumbnail.less"

interface Props {
    group?: GroupSearch | GroupPosts
    image?: string
    live?: string
    onClick?: (event: React.MouseEvent) => void
    style?: React.CSSProperties
}

const GroupThumbnail: React.FunctionComponent<Props> = (props) => {
    const {mobile} = useLayoutSelector()
    const {session} = useSessionSelector()
    const {brightness, contrast, hue, saturation, blur} = useFilterSelector()
    const navigate = useNavigate()
    const imageFiltersRef = useRef<HTMLDivElement | HTMLImageElement>(null)


    const click = (event: React.MouseEvent) => {
        if (!props.group) return
        if (event.ctrlKey || event.metaKey || event.button === 1) {
            window.open(`/group/${props.group.slug}`, "_blank")
        } else {
            navigate(`/group/${props.group.slug}`)
        }
    }

    useEffect(() => {
        if (!imageFiltersRef.current) return
        imageFiltersRef.current.style.filter = `brightness(${brightness}%) contrast(${contrast}%) hue-rotate(${hue - 180}deg) saturate(${saturation}%) blur(${blur}px)`
    }, [brightness, contrast, hue, saturation, blur])

    if (props.image) {
        return <EffectImage className="group-thumbnail-img-outlined" image={props.image} live={props.live} height={300}
                onClick={props.onClick ? props.onClick : click} style={props.style ? props.style : {}}/>
    }

    return (
        <div className="group-thumbnail" onClick={click} ref={imageFiltersRef}>
            {props.group ? <>
            <EffectImage className="group-thumbnail-img" post={props.group.posts[0]}/>
            <div className="group-thumbnail-text-container">
                <span className="group-thumbnail-text">{props.group.name}</span>
            </div></> : null}
        </div>
    )
}

export default GroupThumbnail