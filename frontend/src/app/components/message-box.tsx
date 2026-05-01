'use client';

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner, IconDefinition } from "@fortawesome/free-solid-svg-icons";
import styles from "../styles/message-box.module.css"

type MessageBoxProps = {
    icon?: IconDefinition | null;
    text?: string;
    time?: number;
};

export default function MessageBox({ icon = faSpinner, text = "Placeholder", time = -1 }: MessageBoxProps) {
    const formatTime = (seconds: number) => {
        const h = String(Math.floor(seconds / 3600)).padStart(2, "0");
        const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, "0");
        const s = String(seconds % 60).padStart(2, "0");

        return `${h}:${m}:${s}`;
    };
    
    return (
        <div className={styles.container}>
            <div className={styles.innerContainer}>
                <FontAwesomeIcon icon={icon ?? faSpinner} spin={icon === faSpinner} className={styles.icon} />
                <div className={styles.text}>{text}</div>
                { time >= 0 ? <div className={styles.timer}>{formatTime(time)}</div> : <div></div> }
            </div>
        </div >
    );
}