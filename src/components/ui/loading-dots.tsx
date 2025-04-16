"use client"

import { motion } from "framer-motion"

const transition = { duration: 4, yoyo: Infinity, ease: "easeInOut" }

function CombinedLoadingAnimation() {
    // Variants for the dots and text
    const dotVariants = {
        pulse: {
            scale: [1, 1.5, 1],
            transition: {
                duration: 1.2,
                repeat: Infinity,
                ease: "easeInOut",
            },
        },
    }
    const textVariants = {
        pulse: {
            scale: [1, 1.2, 1],
            transition: {
                duration: 1.2,
                repeat: Infinity,
                ease: "easeInOut",
            },
        },
    }

    return (
        <div className="container">
            {/* MotionPath Animation (Path with Moving Box) */}
            <div className="motion-path-wrapper">
                <svg xmlns="http://www.w3.org/2000/svg" width="451" height="437">
                    <motion.path
                        d="M 239 17 C 142 17 48.5 103 48.5 213.5 C 48.5 324 126 408 244 408 C 362 408 412 319 412 213.5 C 412 108 334 68.5 244 68.5 C 154 68.5 102.68 135.079 99 213.5 C 95.32 291.921 157 350 231 345.5 C 305 341 357.5 290 357.5 219.5 C 357.5 149 314 121 244 121 C 174 121 151.5 167 151.5 213.5 C 151.5 260 176 286.5 224.5 286.5 C 273 286.5 296.5 253 296.5 218.5 C 296.5 184 270 177 244 177 C 218 177 197 198 197 218.5 C 197 239 206 250.5 225.5 250.5 C 245 250.5 253 242 253 218.5"
                        fill="transparent"
                        strokeWidth="12"
                        stroke="#f97316"
                        strokeLinecap="round"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={transition}
                    />
                </svg>
                <motion.div
                    style={box}
                    initial={{ offsetDistance: "0%", scale: 2.5 }}
                    animate={{ offsetDistance: "100%", scale: 1 }}
                    transition={transition}
                />
            </div>

            {/* LoadingThreeDotsPulse Animation (Text and Dots) */}
            <motion.div
                animate="pulse"
                transition={{ staggerChildren: -0.2, staggerDirection: -1 }}
                className="dots-section"
            >
                <motion.div className="text" variants={textVariants}>Loading your data</motion.div>
                <div className="dots-container">
                    <motion.div className="dot" variants={dotVariants} />
                    <motion.div className="dot" variants={dotVariants} />
                    <motion.div className="dot" variants={dotVariants} />
                </div>
            </motion.div>

            <StyleSheet />
        </div>
    )
}

/**
 * ==============   Styles   ================
 */
const box: React.CSSProperties = {
    width: 50,
    height: 50,
    backgroundColor: "#8df0cc",
    borderRadius: 10,
    position: "absolute",
    top: 0,
    left: 0,
    offsetPath: `path("M 239 17 C 142 17 48.5 103 48.5 213.5 C 48.5 324 126 408 244 408 C 362 408 412 319 412 213.5 C 412 108 334 68.5 244 68.5 C 154 68.5 102.68 135.079 99 213.5 C 95.32 291.921 157 350 231 345.5 C 305 341 357.5 290 357.5 219.5 C 357.5 149 314 121 244 121 C 174 121 151.5 167 151.5 213.5 C 151.5 260 176 286.5 224.5 286.5 C 273 286.5 296.5 253 296.5 218.5 C 296.5 184 270 177 244 177 C 218 177 197 198 197 218.5 C 197 239 206 250.5 225.5 250.5 C 245 250.5 253 242 253 218.5")`,
}

function StyleSheet() {
    return (
        <style>
            {`
            .container {
                display: flex;
                flex-direction: column; /* Stack MotionPath and dots vertically */
                justify-content: center;
                align-items: center;
                gap: 20px;
                height: 100vh;
                margin: 0 auto;
            }

            .motion-path-wrapper {
                position: relative;
                display: flex;
                justify-content: center;
                align-items: center;
            }

            .dots-section {
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                gap: 20px;
            }

            .dots-container {
                display: flex; /* Arrange dots in a row */
                gap: 20px;
            }

            .dot {
                width: 20px;
                height: 20px;
                border-radius: 50%;
                background-color: #f97316;
                will-change: transform;
            }

            .text {
                font-size: 24px;
                font-weight: bold;
                color: #f97316;
                will-change: transform;
            }
            `}
        </style>
    )
}

export default CombinedLoadingAnimation