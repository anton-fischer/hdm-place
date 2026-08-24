'use client';

import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck } from "@fortawesome/free-solid-svg-icons";

import styles from "../styles/input-box.module.css"

type UsernameInputProps = {
    onConfirm: (username: string) => void;
    maxLength?: number;
};

export default function UsernameInput({ onConfirm, maxLength = 20 }: UsernameInputProps) {
    const [username, setUsername] = useState("");

    const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        setUsername(e.target.value);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" && username.trim().length > 0) {
            onConfirm(username);
        }
    };

    const isValid = username.trim().length > 0;

    return (
        <div className={styles.container}>
            <div className={styles.innerContainer}>
                <input
                    className={styles.usernameInput}
                    placeholder="Your Username"
                    maxLength={maxLength}
                    value={username}
                    onChange={handleInput}
                    onKeyDown={handleKeyDown}
                    autoFocus
                />
                <button
                    className={styles.confirmButton}
                    disabled={!isValid}
                    onClick={() => onConfirm(username)}
                >
                    <FontAwesomeIcon icon={faCheck} />
                </button>
            </div>
        </div>
    );
}