import React from "react";
import styles from "@/styles/Island.module.css";

interface IslandProps {
  children: React.ReactNode;
}

export function Island({ children }: IslandProps) {
  return <div className={styles.island}>{children}</div>;
}