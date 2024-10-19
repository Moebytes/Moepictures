import React, {useContext, useEffect, useState} from "react"
import {useHistory} from "react-router-dom"
import {HashLink as Link} from "react-router-hash-link"
import TitleBar from "../components/TitleBar"
import NavBar from "../components/NavBar"
import SideBar from "../components/SideBar"
import Footer from "../components/Footer"
import {HideNavbarContext, HideSidebarContext, RelativeContext, HideTitlebarContext, HeaderTextContext, SidebarTextContext,
MobileContext, EnableDragContext, SessionContext, SessionFlagContext} from "../Context"
import CaptchaDialog from "../dialogs/CaptchaDialog"
import premiumStar from "../assets/icons/premium-star.png"
import premiumImg from "../assets/misc/premiumupgrade.png"
import upscaledImg from "../assets/misc/upscaled.png"
import bookmarksImg from "../assets/misc/bookmarks.png"
import historyImg from "../assets/misc/history.png"
import unlimitedTagsImg from "../assets/misc/unlimitedtags.png"
import autosearchImg from "../assets/misc/autosearch.png"
import animatedImg from "../assets/misc/animatedavatar.gif"
import changeUsernameImg from "../assets/misc/changeusername.png"
import upscaledImages from "../assets/misc/premium-upscaled-images.png"
import autosearch from "../assets/misc/premium-autosearch.png"
import searchHistory from "../assets/misc/premium-search-history.png"
import unlimitedTags from "../assets/misc/premium-unlimited-tags.png"
import bookmarkSort from "../assets/misc/premium-bookmark-sort.png"
import animatedAvatar from "../assets/misc/premium-animated-avatar.png"
import changeUsername from "../assets/misc/premium-change-username.png"
import noAds from "../assets/misc/premium-no-ads.png"
import functions from "../structures/Functions"
import bitcoin from "../assets/icons/bitcoin.png"
import "./styles/premiumpage.less"
import axios from "axios"

const PaymentButton: React.FunctionComponent = (props) => {
    const {session, setSession} = useContext(SessionContext)
    const {sessionFlag, setSessionFlag} = useContext(SessionFlagContext)
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
            <span>Pay with Crypto</span>
        </button>
    )
}

const PremiumPage: React.FunctionComponent = (props) => {
    const {hideNavbar, setHideNavbar} = useContext(HideNavbarContext)
    const {hideTitlebar, setHideTitlebar} = useContext(HideTitlebarContext)
    const {hideSidebar, setHideSidebar} = useContext(HideSidebarContext)
    const {enableDrag, setEnableDrag} = useContext(EnableDragContext)
    const {relative, setRelative} = useContext(RelativeContext)
    const {headerText, setHeaderText} = useContext(HeaderTextContext)
    const {sidebarText, setSidebarText} = useContext(SidebarTextContext)
    const {session, setSession} = useContext(SessionContext)
    const {mobile, setMobile} = useContext(MobileContext)
    const [premiumFeature, setPremiumFeature] = useState("premium")
    const history = useHistory()

    useEffect(() => {
        if (!session.cookie) return
        if (!session.username) {
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
        document.title = "Premium"
        window.scrollTo(0, 0)
        urlState()
    }, [])

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
                    <span className="premium-heading">Premium Upgrade</span>
                    <img className="premium-star" src={premiumStar}/>
                </div>
                <span className="premium-text">
                    You can purchase an account upgrade to unlock more features. Thank you for supporting us! <br/><br/>

                    Your contribution allows us to keep the site ad-free for the foreseeable future. We will use it to pay 
                    our hosting and storage costs. <br/><br/>

                    All of the premium features are listed on the left.
                </span>
                <div className="premium-img-container"><img className="premium-img" src={premiumImg}/></div></>
            )
        }
        if (premiumFeature === "upscaled-images") {
            return (
                <><img className="premium-banner" src={upscaledImages}/>
                <span className="premium-text" style={{color: "#2f91ff"}}>
                    View images upscaled to a much higher resolution. Upscaled images have much sharper details 
                    and often fixes any blurriness. We currently use the Real-CUGAN 4x upscaler.
                </span>
                <div className="premium-img-container"><img className="premium-img" src={upscaledImg} style={{maxWidth: "100%"}}/></div></>
            )
        }
        if (premiumFeature === "autosearch") {
            return (
                <><img className="premium-banner" src={autosearch}/>
                <span className="premium-text" style={{color: "#5b2fff"}}>
                    Use the autosearch, which automatically searches your current tags in a loop. You can 
                    configure the time interval between searches.
                </span>
                <div className="premium-img-container"><img className="premium-img" src={autosearchImg}/></div></>
            )
        }
        if (premiumFeature === "search-history") {
            return (
                <><img className="premium-banner" src={searchHistory}/>
                <span className="premium-text" style={{color: "#ff2792"}}>
                    View the history of all posts you have viewed in the past. This is great if you saw a post 
                    you really liked but forgot to favorite it.
                </span>
                <div className="premium-img-container"><img className="premium-img" src={historyImg}/></div></>
            )
        }
        if (premiumFeature === "unlimited-tags") {
            return (
                <><img className="premium-banner" src={unlimitedTags}/>
                <span className="premium-text" style={{color: "#ff3afd"}}>
                    Regular accounts can only search for 3 tags. Premium accounts have this restriction removed
                    and you may search an unlimited number of tags.
                </span>
                <div className="premium-img-container"><img className="premium-img" src={unlimitedTagsImg}/></div></>
            )
        }
        if (premiumFeature === "bookmark-sort") {
            return (
                <><img className="premium-banner" src={bookmarkSort}/>
                <span className="premium-text" style={{color: "#3a51ff"}}>
                    Unlocks the sorting by amount of pixiv bookmarks. This makes it easy to find the posts that 
                    attracted the most popularity.
                </span>
                <div className="premium-img-container"><img className="premium-img" src={bookmarksImg}/></div></>
            )
        }
        if (premiumFeature === "animated-avatar") {
            return (
                <><img className="premium-banner" src={animatedAvatar}/>
                <span className="premium-text" style={{color: "#fb1d90"}}>
                    Regular users can only pick and crop from images on the site. Premium users can upload and 
                    use any avatar. They can also have animated avatars.
                </span>
                <div className="premium-img-container"><img className="premium-img" src={animatedImg}/></div></>
            )
        }
        if (premiumFeature === "change-username") {
            return (
                <><img className="premium-banner" src={changeUsername}/>
                <span className="premium-text" style={{color: "#5e2cff"}}>
                    Premium users unlock the ability to change their username. You may change your name as 
                    many times as you wish.
                </span>
                <div className="premium-img-container"><img className="premium-img" src={changeUsernameImg}/></div></>
            )
        }
        if (premiumFeature === "no-ads") {
            return (
                <><img className="premium-banner" src={noAds} style={{width: "300px"}}/>
                <span className="premium-text" style={{color: "#297aff"}}>
                    Allow us to continue running the website without intrusive advertisements. They're annoying and 
                    not aesthetically pleasing. Thank you!
                </span></>
            )
        }
        if (premiumFeature === "purchase") {
            return (
                <><span className="premium-heading">Purchase</span>
                <span className="premium-text">
                    If you would like to purchase a premium upgrade you can do so here via Coinbase. <br/><br/>

                    Currently the price is $15 USD/yr. Your upgrade will last for one year from the date of purchase. 
                    To extend your term, you may purchase it multiple times. <br/><br/>
                    
                    Create a <a className="premium-link" onClick={() => openLink("https://www.coinbase.com")}>Coinbase</a> account if you don't already have one. 
                    You can buy crypto (eg. bitcoin) with paypal or card through them and then use it to purchase.
                </span>
                <PaymentButton/></>
            )
        }
        if (premiumFeature === "refund-policy") {
            return (
                <><span className="premium-heading">Refund Policy</span>
                <span className="premium-text">
                    You can contact us within 48 hours of making your purchase if you weren’t satisfied. You will receive a refund 
                    minus any processing fees. Contact us at moepictures.moe@gmail.com.
                </span></>
            )
        }
    }

    return (
        <>
        <CaptchaDialog/>
        <TitleBar/>
        <NavBar/>
        <div className="body">
            <SideBar/>
            <div className="content" onMouseEnter={() => setEnableDrag(true)}>
                {session.username ? <div className="premium">
                    <div className="premium-nav">
                        <span className="premium-nav-text" onClick={() => setPremiumFeature("premium")}>Premium</span>
                        <span className="premium-nav-text" style={{color: "#2f91ff"}} onClick={() => setPremiumFeature("upscaled-images")}>Upscaled Images</span>
                        <span className="premium-nav-text" style={{color: "#5b2fff"}} onClick={() => setPremiumFeature("autosearch")}>Autosearch</span>
                        <span className="premium-nav-text" style={{color: "#ff2792"}} onClick={() => setPremiumFeature("search-history")}>Search History</span>
                        <span className="premium-nav-text" style={{color: "#ff3afd"}} onClick={() => setPremiumFeature("unlimited-tags")}>Unlimited Tags</span>
                        <span className="premium-nav-text" style={{color: "#3a51ff"}} onClick={() => setPremiumFeature("bookmark-sort")}>Bookmark Sort</span>
                        <span className="premium-nav-text" style={{color: "#fb1d90"}} onClick={() => setPremiumFeature("animated-avatar")}>Animated Avatar</span>
                        <span className="premium-nav-text" style={{color: "#5e2cff"}} onClick={() => setPremiumFeature("change-username")}>Change Username</span>
                        <span className="premium-nav-text" style={{color: "#297aff"}} onClick={() => setPremiumFeature("no-ads")}>No Ads</span>
                        <span className="premium-nav-text" onClick={() => setPremiumFeature("purchase")}>Purchase</span>
                        <span className="premium-nav-text" onClick={() => setPremiumFeature("refund-policy")}>Refund Policy</span>
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