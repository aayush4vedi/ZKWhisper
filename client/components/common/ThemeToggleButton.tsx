import { MdOutlineDarkMode, MdOutlineLightMode } from "react-icons/md"
const ThemeToggleButton: React.FC<ThemeToggleButtonProps> = ({ theme, toggleTheme }) => {
    return (
        <div className="flex items-center justify-center rounded-3xl mx-2 cursor-pointer text-black dark:text-amber-200  dark:hover:text-slate-600 h-[2.5rem] w-[2.5rem] hover:transition duration-150 bg-black hover:bg-gray-700 hover:text-gray-200 stroke-2 dark:hover:bg-amber-200 dark:hover:text-black">
            {theme === "light" ? (
                <MdOutlineDarkMode size={25} onClick={toggleTheme} />
            ) : (
                <MdOutlineLightMode size={25} onClick={toggleTheme} />
            )}
        </div>
    )
}

export default ThemeToggleButton
