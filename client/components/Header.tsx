import React from "react"

import { useTheme } from "next-themes"
import ThemeToggleButton from "./common/ThemeToggleButton"
import { MdOutlineLightMode } from "react-icons/md"
import { RxHamburgerMenu } from "react-icons/rx"

const style = {
    wrapper: `sticky w-full top-0 left-0 z-40 flex items-center justify-between p-4`,
    wrapperSmooth: `sticky w-full top-0 left-0 z-40 text-white shadow-xl dark:text-gray-800 flex items-center justify-between p-4 backdrop-blur-sm  bg-gradient-to-tr from-rose-100 via-sky-100 to-white dark:bg-gradient-to-tr dark:from-black dark:to-black`,
}

type HeaderProps = {
    title: string
    subtitle: string
}

const Header: React.FC<HeaderProps> = ({ title, subtitle }) => {
    const { theme, setTheme } = useTheme()
    const toggleTheme = () => setTheme(theme === "dark" ? "light" : "dark")

    return (
        <header className="flex items-center justify-between px-10 py-2">
            <div className="flex items-center">
                <RxHamburgerMenu size={25} />
            </div>
            <div className="flex flex-col items-center">
                <h1 className="text-2xl font-bold mb-1 text-gray-500">{title}</h1>
                <p className="text-sm">{subtitle}</p>
            </div>
            <ThemeToggleButton theme={theme} toggleTheme={toggleTheme} />
        </header>
    )
}

export default Header
