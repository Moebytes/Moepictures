/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Moepictures - A cute and moe anime image board ❤          *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import React, {useEffect, useState, useRef} from "react"
import {useInteractionActions, useMiscDialogSelector, useMiscDialogActions, useSessionSelector, useSessionActions, useFlagActions} from "../../store"
import {useThemeSelector} from "../../store"
import functions from "../../functions/Functions"
import permissions from "../../structures/Permissions"
import Draggable from "react-draggable"
import checkbox from "../../assets/svg/checkbox.svg"
import checkboxChecked from "../../assets/svg/checkbox-checked.svg"
import crown from "../../assets/svg/crown.svg"
import curatorStar from "../../assets/svg/curator-star.svg"
import contributorPencil from "../../assets/svg/pencil.svg"
import premiumStar from "../../assets/svg/premium-star.svg"
import {UserRole} from "../../types/Types"
import "../dialog.less"

const PromoteDialog: React.FunctionComponent = (props) => {
    const {siteHue, siteSaturation, siteLightness, i18n} = useThemeSelector()
    const {setEnableDrag} = useInteractionActions()
    const {promoteName} = useMiscDialogSelector()
    const {setPromoteName} = useMiscDialogActions()
    const {setUpdateUserFlag} = useFlagActions()
    const {session} = useSessionSelector()
    const {setSessionFlag} = useSessionActions()
    const [reason, setReason] = useState("")
    const [submitted, setSubmitted] = useState(false)
    const [role, setRole] = useState("user" as UserRole)
    const [error, setError] = useState(false)
    const errorRef = useRef<HTMLSpanElement>(null)

    const getAdminIcon = (icon: string) => {
        return functions.color.colorizeSVG(icon, "--adminColor")
    }

    const getModIcon = (icon: string) => {
        return functions.color.colorizeSVG(icon, "--modColor")
    }

    const getSystemIcon = (icon: string) => {
        return functions.color.colorizeSVG(icon, "--systemColor")
    }

    const getPremiumIcon = (icon: string) => {
        return functions.color.colorizeSVG(icon, "--premiumColor")
    }

    const getCuratorIcon = (icon: string) => {
        return functions.color.colorizeSVG(icon, "--curatorColor")
    }

    const getContributorIcon = (icon: string) => {
        return functions.color.colorizeSVG(icon, "--contributorColor")
    }

    const getUserIcon = (icon: string) => {
        return functions.color.colorizeSVG(icon, "--userColor")
    }

    const updateRole = async () => {
        if (!promoteName) return
        const user = await functions.http.get("/api/user", {username: promoteName}, session, setSessionFlag)
        if (user) setRole(user.role)
    }

    useEffect(() => {
        if (promoteName) {
            document.body.style.pointerEvents = "none"
            updateRole()
        } else {
            document.body.style.pointerEvents = "all"
            setEnableDrag(true)
        }
    }, [promoteName])

    const promote = async () => {
        if (!promoteName) return
        if (!permissions.isAdmin(session)) return setPromoteName(null)
        await functions.http.post("/api/user/promote", {username: promoteName, role}, session, setSessionFlag)
        setPromoteName(null)
        setUpdateUserFlag(true)
    }

    const click = (button: "accept" | "reject") => {
        if (button === "accept") {
            promote()
        } else {
            setPromoteName(null)
        }
    }

    if (promoteName) {
        return (
            <div className="dialog">
                <Draggable handle=".dialog-title-container">
                <div className="dialog-box" style={{width: "300px", height: "420px"}} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                    <div className="dialog-container">
                        <div className="dialog-title-container">
                            <span className="dialog-title">{i18n.dialogs.promote.title}</span>
                        </div>
                        <div className="dialog-row">
                            <img className="dialog-icon" src={getAdminIcon(crown)}/>
                            <span className="dialog-text admin-color">{i18n.roles.admin}:</span>
                            <img className="dialog-checkbox" src={role === "admin" ? getAdminIcon(checkboxChecked) : getAdminIcon(checkbox)} onClick={() => setRole("admin")}/>
                        </div>
                        <div className="dialog-row">
                            <img className="dialog-icon" src={getModIcon(crown)}/>
                            <span className="dialog-text mod-color">{i18n.roles.mod}:</span>
                            <img className="dialog-checkbox" src={role === "mod" ? getModIcon(checkboxChecked) : getModIcon(checkbox)} onClick={() => setRole("mod")}/>
                        </div>
                        <div className="dialog-row">
                            <img className="dialog-icon" src={getPremiumIcon(curatorStar)}/>
                            <span className="dialog-text curator-color">{i18n.roles.premiumCurator}:</span>
                            <img className="dialog-checkbox" src={role === "premium-curator" ? getPremiumIcon(checkboxChecked) : getPremiumIcon(checkbox)} onClick={() => setRole("premium-curator")}/>
                        </div>
                        <div className="dialog-row">
                            <img className="dialog-icon" src={getCuratorIcon(curatorStar)}/>
                            <span className="dialog-text curator-color">{i18n.roles.curator}:</span>
                            <img className="dialog-checkbox" src={role === "curator" ? getCuratorIcon(checkboxChecked) : getCuratorIcon(checkbox)} onClick={() => setRole("curator")}/>
                        </div>
                        <div className="dialog-row">
                            <img className="dialog-icon" src={getPremiumIcon(contributorPencil)}/>
                            <span className="dialog-text premium-color">{i18n.roles.premiumContributor}:</span>
                            <img className="dialog-checkbox" src={role === "premium-contributor" ? getPremiumIcon(checkboxChecked) : getPremiumIcon(checkbox)} onClick={() => setRole("premium-contributor")}/>
                        </div>
                        <div className="dialog-row">
                            <img className="dialog-icon" src={getContributorIcon(contributorPencil)}/>
                            <span className="dialog-text contributor-color">{i18n.roles.contributor}:</span>
                            <img className="dialog-checkbox" src={role === "contributor" ? getContributorIcon(checkboxChecked) : getContributorIcon(checkbox)} onClick={() => setRole("contributor")}/>
                        </div>
                        <div className="dialog-row">
                            <img className="dialog-icon" src={getPremiumIcon(premiumStar)}/>
                            <span className="dialog-text premium-color">{i18n.roles.premium}:</span>
                            <img className="dialog-checkbox" src={role === "premium" ? getPremiumIcon(checkboxChecked) : getPremiumIcon(checkbox)} onClick={() => setRole("premium")}/>
                        </div>
                        <div className="dialog-row">
                            <span className="dialog-text user-color">{i18n.roles.user}:</span>
                            <img className="dialog-checkbox" src={role === "user" ? getUserIcon(checkboxChecked) : getUserIcon(checkbox)} onClick={() => setRole("user")}/>
                        </div>
                        {error ? <div className="dialog-validation-container"><span className="dialog-validation" ref={errorRef}></span></div> : null}
                        <div className="dialog-row">
                            <button onClick={() => click("reject")} className="dialog-button">{i18n.buttons.cancel}</button>
                            <button onClick={() => click("accept")} className="dialog-button">{"Promote"}</button>
                        </div>
                    </div>
                </div>
                </Draggable>
            </div>
        )
    }
    return null
}

export default PromoteDialog