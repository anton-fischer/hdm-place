"use client";

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import type { IconProp } from "@fortawesome/fontawesome-svg-core";

import styles from "../styles/button.module.css"

type ButtonProps = {
    text?: string;
    title?: string;
    icon?: IconProp;
    style?: React.CSSProperties;
    onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
};

export default function Button({ text, title, icon, style, onClick }: ButtonProps) {
    return (
        <button onClick={onClick} title={title} style={style} className={styles.button}>
            {icon && <FontAwesomeIcon icon={icon} />}
            {text && text}
        </button>
    );
}