'use client';

import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronCircleRight, IconDefinition } from "@fortawesome/free-solid-svg-icons";

import styles from "../styles/input-box.module.css"

type UsernameInputProps = {
    icon?: IconDefinition;
    text?: string;
    maxLength?: number;
    onConfirm: (inputText: string) => void;
};

export default function UsernameInput({ icon = faChevronCircleRight, text = "Placeholder", maxLength = 20, onConfirm }: UsernameInputProps) {
    const [inputText, setInputText] = useState("");

    const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInputText(e.target.value);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" && inputText.trim().length > 0) {
            onConfirm(inputText);
        }
    };

    const isValid = inputText.trim().length > 0;

    return (
        <div className={styles.container}>
            <div className={styles.innerContainer}>
                <input
                    className={styles.textInput}
                    placeholder={text}
                    maxLength={maxLength}
                    value={inputText}
                    onChange={handleInput}
                    onKeyDown={handleKeyDown}
                    autoFocus
                />
                <button
                    className={styles.confirmButton}
                    disabled={!isValid}
                    onClick={() => onConfirm(inputText)}
                >
                    <FontAwesomeIcon icon={icon} />
                </button>
            </div>
        </div>
    );
}