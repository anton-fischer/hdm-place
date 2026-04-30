'use client';

import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLock } from "@fortawesome/free-solid-svg-icons";
import styles from "../styles/color-picker.module.css"

const PRESETS = [
    "#ff0000",
    "#00ff00",
    "#0000ff",
    "#000000",
    "#ffffff",
    "#ffff00",
    "#ff00ff",
    "#00ffff",
];

type ColorPickerProps = {
    isLocked: boolean;
    timeLeft: number;
    selectedColor: string;
    setSelectedColor: (color: string) => void;
};

export default function ColorPicker({ isLocked, timeLeft, selectedColor, setSelectedColor }: ColorPickerProps) {
    const [inputValue, setInputValue] = useState("");
    const [isCustomColorSelected, setIsCustomColorSelected] = useState(false);

    const toggleColor = (color: string) => {       
        if (selectedColor === color) {
            setSelectedColor("");
        } else {
            setIsCustomColorSelected(false);
            setInputValue("");
            setSelectedColor(color);
        }
    };

    const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setInputValue(value);

        // validate hex input
        const isValidHex = /^#([0-9A-F]{3}){1,2}$/i.test(value);
        if (isValidHex) {
            setIsCustomColorSelected(true);
            setSelectedColor(value);
        }
    };

    const formatTime = (seconds: number) => {
        const h = String(Math.floor(seconds / 3600)).padStart(2, "0");
        const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, "0");
        const s = String(seconds % 60).padStart(2, "0");

        return `${h}:${m}:${s}`;
    };

    return (
        <div className={styles.container}>
            {isLocked ? (
                <div className={styles.lockContainer}>
                    <FontAwesomeIcon icon={faLock} className={styles.lockIcon} />
                    <div className={styles.timer}>{formatTime(timeLeft)}</div>
                </div>
            ) : (
                <div className={styles.colorList}>
                    {PRESETS.map((color) => (
                        <button
                            key={color}
                            className={`${styles.colorButton} ${selectedColor === color ? styles.active : ""}`}
                            style={{ backgroundColor: color }}
                            onClick={() => toggleColor(color)}
                        />
                    ))}
                    <br />
                    <input
                        className={styles.colorInput}
                        style={isCustomColorSelected ? {
                            border: `2px solid ${selectedColor}`,
                            boxShadow: "0 0 8px rgba(255, 255, 255, 0.6)"
                        } : {
                            border: "none"
                        }}
                        placeholder="#ff8800"
                        maxLength={7}
                        value={inputValue}
                        onChange={handleInput}
                    />
                </div>
            )}
        </div >
    );
}