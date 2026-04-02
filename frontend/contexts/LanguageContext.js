"use client";
import { createContext, useContext, useState, useEffect } from "react";
import translations from "@/lib/i18n";

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState("zh");

  useEffect(() => {
    const saved = localStorage.getItem("qm_lang");
    if (saved === "en" || saved === "zh") setLang(saved);
  }, []);

  function toggleLang() {
    const next = lang === "zh" ? "en" : "zh";
    setLang(next);
    localStorage.setItem("qm_lang", next);
  }

  const t = translations[lang];

  return (
    <LanguageContext.Provider value={{ lang, toggleLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used inside LanguageProvider");
  return ctx;
}
