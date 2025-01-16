import React, {useEffect, useState} from "react"
import {useHistory} from "react-router-dom"
import TitleBar from "../../components/site/TitleBar"
import NavBar from "../../components/site/NavBar"
import SideBar from "../../components/site/SideBar"
import Footer from "../../components/site/Footer"
import {useThemeSelector, useInteractionActions, useSessionSelector, useSessionActions,
useLayoutActions, useActiveActions, useLayoutSelector} from "../../store"
import premiumStar from "../../assets/icons/premium-star.png"
import premiumImg from "../../assets/images/premiumupgrade.png"
import upscaledImg from "../../assets/images/upscaled.png"
import bookmarksImg from "../../assets/images/bookmarks.png"
import historyImg from "../../assets/images/history.png"
import unlimitedTagsImg from "../../assets/images/unlimitedtags.png"
import autosearchImg from "../../assets/images/autosearch.png"
import animatedImg from "../../assets/images/animatedavatar.gif"
import changeUsernameImg from "../../assets/images/changeusername.png"
import upscaledImages from "../../assets/images/premium-upscaled-images.png"
import autosearch from "../../assets/images/premium-autosearch.png"
import searchHistory from "../../assets/images/premium-search-history.png"
import unlimitedTags from "../../assets/images/premium-unlimited-tags.png"
import bookmarkSort from "../../assets/images/premium-bookmark-sort.png"
import animatedAvatar from "../../assets/images/premium-animated-avatar.png"
import changeUsername from "../../assets/images/premium-change-username.png"
import noAds from "../../assets/images/premium-no-ads.png"
import functions from "../../structures/Functions"
import permissions from "../../structures/Permissions"
import bitcoin from "../../assets/icons/bitcoin.png"
import "./styles/premiumpage.less"
import axios from "axios"

const PaymentButton: React.FunctionComponent = (props) => {
    const {i18n} = useThemeSelector()
    const {session} = useSessionSelector()
    const {setSessionFlag} = useSessionActions()
    const [paymentLink, setPaymentLink] = useState("")
    const history = useHistory()

    const createCharge = async () => {
        const result = await functions.post("/api/premium/paymentlink", null, session, setSessionFlag)
        setPaymentLink(result.hosted_url)
    }

    useEffect(() => {
        if (!session.username) return
        createCharge()
    }, [session])

    const openPaymentLink = () => {
        window.open(paymentLink)
    }

    return (
        <button className="premium-button" onClick={openPaymentLink}>
            <img src={bitcoin}/>
            <span>{i18n.premium.purchase.payWithCrypto}</span>
        </button>
    )
}

const PremiumPage: React.FunctionComponent = (props) => {
    const {i18n} = useThemeSelector()
    const {setHideNavbar, setHideTitlebar, setHideSidebar, setRelative} = useLayoutActions()
    const {setEnableDrag} = useInteractionActions()
    const {setHeaderText, setSidebarText} = useActiveActions()
    const {session} = useSessionSelector()
    const {mobile} = useLayoutSelector()
    const [premiumFeature, setPremiumFeature] = useState("premium")
    const history = useHistory()

    useEffect(() => {
        if (!session.cookie) return
        let condition = permissions.isPremiumEnabled() ? session.username : permissions.isAdmin(session)
        if (!condition) {
            functions.replaceLocation("/401")
        }
    }, [session])

    const urlState = () => {
        if (window.location.hash) setPremiumFeature(window.location.hash.replace("#", ""))
    }

    useEffect(() => {
        setHideNavbar(true)
        setHideTitlebar(true)
        setHideSidebar(false)
        setRelative(false)
        setHeaderText("")
        setSidebarText("")
        window.scrollTo(0, 0)
        urlState()
    }, [])

    useEffect(() => {
        document.title = i18n.roles.premium
    }, [i18n])

    useEffect(() => {
        if (mobile) {
            setRelative(true)
        } else {
            setRelative(false)
        }
    }, [mobile])

    useEffect(() => {
        if (mobile) {
            setRelative(true)
        } else {
            setRelative(false)
        }
    }, [mobile])

    useEffect(() => {
        if (premiumFeature === "premium") {
            window.history.pushState(null, document.title, window.location.pathname + window.location.search)
        } else {
            window.location.hash = premiumFeature
        }
    }, [premiumFeature])

    const openLink = (url: string) => {
        window.open(url, "_blank", "noreferrer")
    }

    const getContainerJSX = () => {
        if (premiumFeature === "premium") {
            return (
                <><div className="premium-row">
                    <span className="premium-heading">{i18n.premium.premium.title}</span>
                    <img className="premium-star" src={premiumStar}/>
                </div>
                <span className="premium-text" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                    {i18n.premium.premium.line1}<br/><br/>

                    {i18n.premium.premium.line2}<br/><br/>

                    {i18n.premium.premium.line3}
                </span>
                <div className="premium-img-container"><img className="premium-img" src={premiumImg}/></div></>
            )
        }
        if (premiumFeature === "upscaled-images") {
            return (
                <><img className="premium-banner" src={upscaledImages}/>
                <span className="premium-text" style={{color: "#2f91ff"}} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                    {i18n.premium.upscaledImages.header}
                </span>
                <div className="premium-img-container"><img className="premium-img" src={upscaledImg} style={{maxWidth: "100%"}}/></div></>
            )
        }
        if (premiumFeature === "autosearch") {
            return (
                <><img className="premium-banner" src={autosearch}/>
                <span className="premium-text" style={{color: "#5b2fff"}} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                    {i18n.premium.autoSearch.header}
                </span>
                <div className="premium-img-container"><img className="premium-img" src={autosearchImg}/></div></>
            )
        }
        if (premiumFeature === "search-history") {
            return (
                <><img className="premium-banner" src={searchHistory}/>
                <span className="premium-text" style={{color: "#ff2792"}} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                    {i18n.premium.searchHistory.header}
                </span>
                <div className="premium-img-container"><img className="premium-img" src={historyImg}/></div></>
            )
        }
        if (premiumFeature === "unlimited-tags") {
            return (
                <><img className="premium-banner" src={unlimitedTags}/>
                <span className="premium-text" style={{color: "#ff3afd"}} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                    {i18n.premium.unlimitedTages.header}
                </span>
                <div className="premium-img-container"><img className="premium-img" src={unlimitedTagsImg}/></div></>
            )
        }
        if (premiumFeature === "bookmark-sort") {
            return (
                <><img className="premium-banner" src={bookmarkSort}/>
                <span className="premium-text" style={{color: "#3a51ff"}} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                    {i18n.premium.bookmarkSort.header}
                </span>
                <div className="premium-img-container"><img className="premium-img" src={bookmarksImg}/></div></>
            )
        }
        if (premiumFeature === "animated-avatar") {
            return (
                <><img className="premium-banner" src={animatedAvatar}/>
                <span className="premium-text" style={{color: "#fb1d90"}} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                    {i18n.premium.animatedAvatar.header}
                </span>
                <div className="premium-img-container"><img className="premium-img" src={animatedImg}/></div></>
            )
        }
        if (premiumFeature === "change-username") {
            return (
                <><img className="premium-banner" src={changeUsername}/>
                <span className="premium-text" style={{color: "#5e2cff"}} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                    {i18n.premium.changeUsername.header}
                </span>
                <div className="premium-img-container"><img className="premium-img" src={changeUsernameImg}/></div></>
            )
        }
        if (premiumFeature === "no-ads") {
            return (
                <><img className="premium-banner" src={noAds} style={{width: "300px"}}/>
                <span className="premium-text" style={{color: "#297aff"}} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                    {i18n.premium.noAds.header}
                </span></>
            )
        }
        if (premiumFeature === "purchase") {
            return (
                <><span className="premium-heading">{i18n.premium.purchase.title}</span>
                <span className="premium-text" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                    {i18n.premium.purchase.line1}<br/><br/>

                    {i18n.premium.purchase.line2}<br/><br/>
                    
                    {i18n.premium.purchase.createA}<a className="premium-link" onClick={() => openLink("https://www.coinbase.com")}>Coinbase</a>
                    {i18n.premium.purchase.line3}
                </span>
                <PaymentButton/></>
            )
        }
        if (premiumFeature === "refund-policy") {
            return (
                <><span className="premium-heading">{i18n.premium.refundPolicy.title}</span>
                <span className="premium-text" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                    {i18n.premium.refundPolicy.header}
                </span></>
            )
        }
    }

    return (
        <>
        <TitleBar/>
        <NavBar/>
        <div className="body">
            <SideBar/>
            <div className="content" onMouseEnter={() => setEnableDrag(true)}>
                {session.username ? <div className="premium">
                    <div className="premium-nav">
                        <span className="premium-nav-text" onClick={() => setPremiumFeature("premium")}>{i18n.roles.premium}</span>
                        <span className="premium-nav-text" style={{color: "#2f91ff"}} onClick={() => setPremiumFeature("upscaled-images")}>{i18n.user.upscaledImages}</span>
                        <span className="premium-nav-text" style={{color: "#5b2fff"}} onClick={() => setPremiumFeature("autosearch")}>{i18n.premium.autoSearch.title}</span>
                        <span className="premium-nav-text" style={{color: "#ff2792"}} onClick={() => setPremiumFeature("search-history")}>{i18n.history.search}</span>
                        <span className="premium-nav-text" style={{color: "#ff3afd"}} onClick={() => setPremiumFeature("unlimited-tags")}>{i18n.premium.unlimitedTages.title}</span>
                        <span className="premium-nav-text" style={{color: "#3a51ff"}} onClick={() => setPremiumFeature("bookmark-sort")}>{i18n.premium.bookmarkSort.title}</span>
                        <span className="premium-nav-text" style={{color: "#fb1d90"}} onClick={() => setPremiumFeature("animated-avatar")}>{i18n.premium.animatedAvatar.title}</span>
                        <span className="premium-nav-text" style={{color: "#5e2cff"}} onClick={() => setPremiumFeature("change-username")}>{i18n.user.changeUsername}</span>
                        <span className="premium-nav-text" style={{color: "#297aff"}} onClick={() => setPremiumFeature("no-ads")}>{i18n.premium.noAds.title}</span>
                        <span className="premium-nav-text" onClick={() => setPremiumFeature("purchase")}>{i18n.premium.purchase.title}</span>
                        <span className="premium-nav-text" onClick={() => setPremiumFeature("refund-policy")}>{i18n.premium.refundPolicy.title}</span>
                    </div>
                    <div className="premium-container">
                        {getContainerJSX()}
                    </div> 
                </div> : null}
                <Footer/>
            </div>
        </div>
        </>
    )
}

export default PremiumPage