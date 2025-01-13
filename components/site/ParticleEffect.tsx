import React, {useEffect, useState, useMemo} from "react"
import {useThemeSelector, useThemeActions} from "../../store"
import {loadSnowPreset} from "@tsparticles/preset-snow"
import {loadAll} from "@tsparticles/all"

const ParticleEffect: React.FunctionComponent = (props) => {
    const {theme, siteHue, particles, particleAmount, particleSize, particleSpeed} = useThemeSelector()
    const {setParticles, setParticleAmount, setParticleSize, setParticleSpeed} = useThemeActions()
    const [jsx, setJSX] = useState(null as React.ReactElement | null)

    useEffect(() => {
        const savedParticles = localStorage.getItem("particles")
        if (savedParticles) setParticles(savedParticles === "true")
        const savedParticleAmount = localStorage.getItem("particleAmount")
        if (savedParticleAmount) setParticleAmount(Number(savedParticleAmount))
        const savedParticleSize = localStorage.getItem("particleSize")
        if (savedParticleSize) setParticleSize(Number(savedParticleSize))
        const savedParticleSpeed = localStorage.getItem("particleSpeed")
        if (savedParticleSpeed) setParticleSpeed(Number(savedParticleSpeed))
    }, [])

    useEffect(() => {
        localStorage.setItem("particles", String(particles))
        localStorage.setItem("particleAmount", String(particleAmount))
        localStorage.setItem("particleSize", String(particleSize))
        localStorage.setItem("particleSpeed", String(particleSpeed))
    }, [particles, particleAmount, particleSize, particleSpeed])

    const computedColor = () => {
        if (theme === "dark") return "#ffffff"
        return getComputedStyle(document.documentElement).getPropertyValue("--text")
    }

    const loadParticles = async () => {
        const {Particles, initParticlesEngine} = await import("@tsparticles/react")
        initParticlesEngine(async (engine) => {
            await loadAll(engine)
            await loadSnowPreset(engine)
            setJSX(
                <Particles id="particles" options={{
                    preset: "snow",
                    background: {opacity: 0},
                    fullScreen: {enable: true, zIndex: 9999},
                    particles: {
                        number: {value: particleAmount},
                        color: {value: computedColor()},
                        size: {value: {min: particleSize, max: particleSize + 2}},
                        opacity: {value: {min: 0.3, max: 0.7}},
                        shape: {
                            type: "character",
                            options: {
                                character: {
                                    value: "❄",
                                    font: "Verdana",
                                    style: "",
                                    weight: "400"
                                }
                            }
                        },
                        move: {
                            enable: true,
                            speed: particleSpeed,
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
    }, [particles, particleAmount, particleSize, particleSpeed, theme, siteHue])

    return jsx
}

export default ParticleEffect