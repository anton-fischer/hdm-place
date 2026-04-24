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
    const [selectedColors, setSelectedColors] = useState<string[]>([]);
    const [inputValue, setInputValue] = useState("");

    const toggleColor = (color: string) => {
        setSelectedColors((prev) =>
            prev.includes(color)
                ? prev.filter((c) => c !== color)
                : [...prev, color]
        );
    };

    const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setInputValue(value);

        // validate hex input
        const isValidHex = /^#([0-9A-F]{3}){1,2}$/i.test(value);

        if (isValidHex) {
            if (!selectedColors.includes(value)) {
                setSelectedColors((prev) => [...prev, value]);
            }
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.colorList}>
                {PRESETS.map((color) => (
                    <button
                        key={color}
                        className={`${styles.colorButton} ${selectedColors.includes(color) ? styles.active : ""}`}
                        style={{ backgroundColor: color }}
                        onClick={() => toggleColor(color)}
                    />
                ))}
                <br />
                <input
                    className={styles.colorInput}
                    placeholder="#ff8800"
                    value={inputValue}
                    onChange={handleInput}
                />
            </div>
        </div>
    );
}