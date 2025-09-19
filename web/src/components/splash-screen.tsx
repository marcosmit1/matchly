"use client";

import React, { useState, useEffect, useRef } from "react";
import styles from "./splash-screen.module.css";

export default function SplashScreen({ force = false }: { force?: boolean }) {
  const [show, setShow] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);
  const logoRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const seen = typeof window !== "undefined" && sessionStorage.getItem("matchly-splash-seen") === "1";
    if (seen && !force) {
      setShow(false);
      return;
    }

    // Initial animations
    const timer1 = setTimeout(() => {
      if (logoRef.current) {
        logoRef.current.classList.add(styles.animate);
      }
    }, 100);

    const timer2 = setTimeout(() => {
      if (textRef.current) {
        textRef.current.classList.add(styles.show);
      }
    }, 600);

    // Hide splash and mark as seen
    const hide = setTimeout(() => {
      setFadeOut(true);
      setTimeout(() => {
        setShow(false);
        try {
          sessionStorage.setItem("matchly-splash-seen", "1");
        } catch {}
      }, 300);
    }, 2000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(hide);
    };
  }, [force]);

  if (!show) return null;

  return (
    <div className={`${styles["splash-container"]} ${fadeOut ? styles["fade-out"] : ""}`}>
      <div className={styles["content-wrapper"]}>
        <div ref={logoRef} className={styles["logo-container"]}>
          <div className={styles.glow} />
          <div className={styles.logo}>
            <img 
              src="/app-logo.png" 
              alt="Matchly" 
              className="w-24 h-24 object-contain animate-pulse"
            />
          </div>
        </div>
        <p ref={textRef} className={styles["loading-text"]}>
          Welcome to Matchly...
        </p>
      </div>
    </div>
  );
}