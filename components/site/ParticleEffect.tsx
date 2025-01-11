import React, {useEffect, useState, useMemo} from "react"
import {useThemeSelector, useThemeActions} from "../../store"

const ParticleEffect: React.FunctionComponent = (props) => {
    const {theme, siteHue, particles} = useThemeSelector()
    const {setParticles} = useThemeActions()
    const [jsx, setJSX] = useState(null as React.ReactElement | null)

    useEffect(() => {
        const savedParticles = localStorage.getItem("particles")
        if (savedParticles) setParticles(savedParticles === "true")
    }, [])

    useEffect(() => {
        localStorage.setItem("particles", String(particles))
    }, [particles])

    const computedColor = () => {
        if (theme === "dark") return "#ffffff"
        return getComputedStyle(document.documentElement).getPropertyValue("--text")
    }

    const loadParticles = async () => {
        const {Particles, initParticlesEngine} = await import("@tsparticles/react")
        const {loadSnowPreset} = await import("@tsparticles/preset-snow")
        initParticlesEngine(async (engine) => {
            await loadSnowPreset(engine)
            setJSX(
                <Particles id="particles" options={{
                    preset: "snow",
                    background: {opacity: 0},
                    fullScreen: {enable: true, zIndex: 9999},
                    reduceDuplicates: true,
                    fpsLimit: 30,
                    particles: {
                        number: {value: 25},
                        color: {value: computedColor()},
                        size: {value: {min: 1, max: 2}},
                        opacity: {value: {min: 0.3, max: 0.7}},
                        move: {
                            enable: true,
                            speed: 2,
                            direction: "bottom",
                            straight: true
                        },
                        wobble: {
                            distance: 3,
                            enable: true,
                            speed: {
                                min: -3,
                                max: 3,
                            },
                        }
                    }
                }}/>
            )
        })
    }

    useEffect(() => {
        if (particles) {
            loadParticles()
        } else {
            setJSX(null)
        }
    }, [particles, theme, siteHue])

    return jsx
}

export default ParticleEffect