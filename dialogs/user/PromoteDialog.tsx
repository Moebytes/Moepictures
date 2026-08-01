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
import {motion, useDragControls} from "framer-motion"
import CheckboxIcon from "../../assets/svg/checkbox.svg"
import CheckboxCheckedIcon from "../../assets/svg/checkbox-checked.svg"
import CrownIcon from "../../assets/svg/crown.svg"
import CuratorStarIcon from "../../assets/svg/curator-star.svg"
import ContributorPencilIcon from "../../assets/svg/pencil.svg"
import PremiumStarIcon from "../../assets/svg/premium-star.svg"
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
    const controls = useDragControls()

    const updateRole = async () => {
        if (!promoteName) return
        const user = await functions.http.get("/api/user", {username: promoteName}, session, setSessionFlag)
        if (user) setRole(user.role)
    }

    useEffect(() => {
        if (promoteName) {
            document.body.style.pointerEvents = "none"
            document.body.style.userSelect = "none"
            updateRole()
        } else {
            document.body.style.pointerEvents = "all"
            document.body.style.userSelect = "auto"
            setEnableDrag(true)
        }
    }, [promoteName])

    const promote = async () => {
        if (!promoteName) return
        if (!permissions.isAdmin(session)) return setPromoteName(null)
        try {
            await functions.http.post("/api/user/promote", {username: promoteName, role}, session, setSessionFlag)
            setPromoteName(null)
            setUpdateUserFlag(true)
        } catch (err: any) {
            let errMsg = i18n.toast.error
            if (err.message.includes("User doesn't have 2fa")) errMsg = i18n.dialogs.promote.no2fa
            setError(true)
            if (!errorRef.current) await functions.timeout(20)
            errorRef.current!.innerText = errMsg
            await functions.timeout(3000)
            setError(false)
        }
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
                <motion.div drag dragControls={controls} dragListener={false} dragMomentum={false}
                className="dialog-box" style={{width: "300px"}} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                    <div className="dialog-container">
                        <div className="dialog-title-container" onPointerDown={(event) => controls.start(event)}>
                            <span className="dialog-title">{i18n.dialogs.promote.title}</span>
                        </div>
                        <div className="dialog-row">
                            <CrownIcon className="dialog-icon" style={{color: "var(--adminColor)"}}/>
                            <span className="dialog-text admin-color">{i18n.roles.admin}:</span>
                            {role === "admin" ? 
                            <CheckboxCheckedIcon className="dialog-checkbox" style={{color: "var(--adminColor)"}} onClick={() => setRole("admin")}/> :
                            <CheckboxIcon className="dialog-checkbox" style={{color: "var(--adminColor)"}} onClick={() => setRole("admin")}/>}
                        </div>
                        <div className="dialog-row">
                            <CrownIcon className="dialog-icon" style={{color: "var(--modColor)"}}/>
                            <span className="dialog-text mod-color">{i18n.roles.mod}:</span>
                            {role === "mod" ? 
                            <CheckboxCheckedIcon className="dialog-checkbox" style={{color: "var(--modColor)"}} onClick={() => setRole("mod")}/> :
                            <CheckboxIcon className="dialog-checkbox" style={{color: "var(--modColor)"}} onClick={() => setRole("mod")}/>}
                        </div>
                        <div className="dialog-row">
                            <CuratorStarIcon className="dialog-icon" style={{color: "var(--premiumColor)"}}/>
                            <span className="dialog-text curator-color">{i18n.roles.premiumCurator}:</span>
                            {role === "premium-curator" ? 
                            <CheckboxCheckedIcon className="dialog-checkbox" style={{color: "var(--premiumColor)"}} onClick={() => setRole("premium-curator")}/> :
                            <CheckboxIcon className="dialog-checkbox" style={{color: "var(--premiumColor)"}} onClick={() => setRole("premium-curator")}/>}
                        </div>
                        <div className="dialog-row">
                            <CuratorStarIcon className="dialog-icon" style={{color: "var(--curatorColor)"}}/>
                            <span className="dialog-text curator-color">{i18n.roles.curator}:</span>
                            {role === "curator" ? 
                            <CheckboxCheckedIcon className="dialog-checkbox" style={{color: "var(--curatorColor)"}} onClick={() => setRole("curator")}/> :
                            <CheckboxIcon className="dialog-checkbox" style={{color: "var(--curatorColor)"}} onClick={() => setRole("curator")}/>}
                        </div>
                        <div className="dialog-row">
                            <ContributorPencilIcon className="dialog-icon" style={{color: "var(--premiumColor)"}}/>
                            <span className="dialog-text premium-color">{i18n.roles.premiumContributor}:</span>
                            {role === "premium-contributor" ? 
                            <CheckboxCheckedIcon className="dialog-checkbox" style={{color: "var(--premiumColor)"}} onClick={() => setRole("premium-contributor")}/> :
                            <CheckboxIcon className="dialog-checkbox" style={{color: "var(--premiumColor)"}} onClick={() => setRole("premium-contributor")}/>}
                        </div>
                        <div className="dialog-row">
                            <ContributorPencilIcon className="dialog-icon" style={{color: "var(--contributorColor)"}}/>
                            <span className="dialog-text contributor-color">{i18n.roles.contributor}:</span>
                            {role === "contributor" ? 
                            <CheckboxCheckedIcon className="dialog-checkbox" style={{color: "var(--contributorColor)"}} onClick={() => setRole("contributor")}/> :
                            <CheckboxIcon className="dialog-checkbox" style={{color: "var(--contributorColor)"}} onClick={() => setRole("contributor")}/>}
                        </div>
                        <div className="dialog-row">
                            <PremiumStarIcon className="dialog-icon" style={{color: "var(--premiumColor)"}}/>
                            <span className="dialog-text premium-color">{i18n.roles.premium}:</span>
                            {role === "premium" ? 
                            <CheckboxCheckedIcon className="dialog-checkbox" style={{color: "var(--premiumColor)"}} onClick={() => setRole("premium")}/> :
                            <CheckboxIcon className="dialog-checkbox" style={{color: "var(--premiumColor)"}} onClick={() => setRole("premium")}/>}
                        </div>
                        <div className="dialog-row">
                            <span className="dialog-text user-color">{i18n.roles.user}:</span>
                            {role === "user" ? 
                            <CheckboxCheckedIcon className="dialog-checkbox" style={{color: "var(--userColor)"}} onClick={() => setRole("user")}/> :
                            <CheckboxIcon className="dialog-checkbox" style={{color: "var(--userColor)"}} onClick={() => setRole("user")}/>}
                        </div>
                        {error ? <div className="dialog-validation-container"><span className="dialog-validation" ref={errorRef}></span></div> : null}
                        <div className="dialog-row">
                            <button onClick={() => click("reject")} className="dialog-button">{i18n.buttons.cancel}</button>
                            <button onClick={() => click("accept")} className="dialog-button">{"Promote"}</button>
                        </div>
                    </div>
                </motion.div>
            </div>
        )
    }
    return null
}

export default PromoteDialog