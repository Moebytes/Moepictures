/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Moepictures - A cute and moe anime image board ❤          *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import React, {useEffect, useLayoutEffect, useState} from "react"
import {createPortal} from "react-dom"
import {autoUpdate, flip, hide, Placement, shift, size, useFloating} from "@floating-ui/react-dom"

interface Props extends React.HTMLAttributes<HTMLDivElement> {
    anchorRef: React.RefObject<Element | null>
    active: boolean
    placement?: Placement
    zIndex?: number
    allowFlip?: boolean
    scrollInside?: boolean
    interactive?: boolean
}

const AnchoredPopup: React.FunctionComponent<Props> = ({anchorRef, active, placement = "bottom", 
    zIndex = 2500, allowFlip = true, scrollInside = false, interactive = true, children, style, ...props}) => {
    const [portalTarget, setPortalTarget] = useState<Element | null>(null)

    const {refs, elements, floatingStyles, placement: resolvedPlacement, 
        middlewareData, isPositioned, update} = useFloating({
        open: active,
        placement,
        strategy: "fixed",
        middleware: [
            allowFlip ? flip() : undefined,
            shift(),
            size({apply: ({availableWidth, availableHeight, elements}) => {
                Object.assign(elements.floating.style, {
                    maxWidth: `${Math.max(0, availableWidth)}px`,
                    maxHeight: `${Math.max(0, availableHeight)}px`
                })
            }}),
            hide()
        ]
    })

    useEffect(() => {
        const updateTarget = () => setPortalTarget(document.fullscreenElement || document.body)
        updateTarget()
        document.addEventListener("fullscreenchange", updateTarget)
        return () => document.removeEventListener("fullscreenchange", updateTarget)
    }, [])

    useLayoutEffect(() => {
        refs.setReference(anchorRef.current)
    })

    useEffect(() => {
        if (!active || !elements.reference || !elements.floating) return
        return autoUpdate(elements.reference, elements.floating, update, {animationFrame: true})
    }, [active, elements.reference, elements.floating, update])

    if (!portalTarget) return null

    const portalElement = (
        <div ref={refs.setFloating} aria-hidden={!active} inert={!active} style={{
            ...floatingStyles,
            width: "max-content",
            zIndex,
            visibility: !elements.reference || (active && !isPositioned) || middlewareData.hide?.referenceHidden ? "hidden" : undefined,
            pointerEvents: active && interactive ? "auto" : "none",
            overflow: scrollInside || !interactive ? "visible" : "auto",
            overscrollBehavior: "contain"
        }}>
            <div {...props} style={{
                ...style,
                position: "relative",
                inset: "auto",
                margin: 0,
                maxWidth: "inherit",
                maxHeight: scrollInside ? "inherit" : undefined,
                boxSizing: "border-box",
                overflow: scrollInside && interactive ? "auto" : "visible",
                overscrollBehavior: "contain",
                transformOrigin: resolvedPlacement.startsWith("top") ? "bottom" : "top"
            }}>
                {children}
            </div>
        </div>
    )

    return createPortal(portalElement, portalTarget)
}

export default AnchoredPopup