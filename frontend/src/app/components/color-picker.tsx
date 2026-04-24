'use client';

import { useState } from "react";
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

export default function ColorPicker() {
    const [selectedColor, setSelectedColor] = useState("");
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

    return (
        <div className={styles.container}>
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
        </div>
    );
}