"use client";

import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner, faTrophy, faTriangleExclamation } from "@fortawesome/free-solid-svg-icons";

import { fetchLeaderboard } from "../utils/api";

import styles from "../styles/leaderboard.module.css";

type LeaderboardEntry = {
    id: string;
    pixelCount: number;
};

export default function Leaderboard() {
    const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        setLoading(true);
        setError(false);

        fetchLeaderboard(false)
            .then((data: LeaderboardEntry[]) => {
                setEntries(data);
            })
            .catch(() => {
                setError(true);
            })
            .finally(() => {
                setLoading(false);
            });
    }, []);

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <FontAwesomeIcon icon={faTrophy} className={styles.headerIcon} />
                <span className={styles.headerText}>Most pixels placed</span>
            </div>

            {loading ? (
                <div className={styles.statusRow}>
                    <FontAwesomeIcon icon={faSpinner} spin className={styles.statusIcon} />
                    <span>Loading...</span>
                </div>
            ) : error ? (
                <div className={styles.statusRow}>
                    <FontAwesomeIcon icon={faTriangleExclamation} className={styles.statusIcon} />
                    <span>Error while loading leaderboard</span>
                </div>
            ) : entries.length === 0 ? (
                <div className={styles.statusRow}>
                    <span>Place a pixel to be first on the leaderboard!</span>
                </div>
            ) : (
                <ul className={styles.list}>
                    {entries.map((entry, index) => (
                        <li key={entry.id} className={styles.listItem}>
                            <span className={styles.rank}>{index + 1}</span>
                            <span className={styles.userId}>{entry.id}</span>
                            <span className={styles.pixelCount}>{entry.pixelCount}</span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}