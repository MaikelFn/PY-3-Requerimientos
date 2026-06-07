"use client";
import { createContext, useContext, useState, ReactNode } from "react";
import { IdiomaClave } from "@/lib/idiomas";
import { i18 } from "@/lib/idiomas";

type LanguageContextType = {
  idioma: IdiomaClave;
  setIdioma: (idioma: IdiomaClave) => void;
  t: (clave: string) => string;
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [idioma, setIdioma] = useState<IdiomaClave>("es");

  // Función helper t() para usar en componentes: t("buscar") en vez de i18("buscar", idioma)
  const t = (clave: string) => i18(clave, idioma);

  return (
    <LanguageContext.Provider value={{ idioma, setIdioma, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage debe usarse dentro de un LanguageProvider");
  }
  return context;
}