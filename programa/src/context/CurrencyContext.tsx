"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

type Currency = "USD" | "CRC";

interface CurrencyContextValue {
  currency: Currency;
  exchangeRate: number;
  loading: boolean;
  error: string | null;
  setCurrency: (currency: Currency) => void;
  formatCurrency: (usdAmount: number, overrideCurrency?: Currency) => string;
  toSelectedCurrency: (usdAmount: number) => number;
}

const CurrencyContext = createContext<CurrencyContextValue>({
  currency: "USD",
  exchangeRate: 515,
  loading: true,
  error: null,
  setCurrency: () => {},
  formatCurrency: () => "$0.00",
  toSelectedCurrency: (amount) => amount,
});

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState<Currency>("USD");
  const [exchangeRate, setExchangeRate] = useState<number>(515);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem("monedaSeleccionada");
    if (stored === "USD" || stored === "CRC") {
      setCurrencyState(stored);
    }
  }, []);

  useEffect(() => {
    async function cargarTipoCambio() {
      try {
        const respuesta = await fetch("/api/monedas");
        const data = await respuesta.json();

        if (respuesta.ok && typeof data.valorDolar === "number") {
          setExchangeRate(data.valorDolar);
        } else {
          throw new Error(data.error || "Tipo de cambio inválido");
        }
      } catch (err) {
        console.error("Error al cargar tipo de cambio:", err);
        setError("No se pudo cargar el tipo de cambio");
      } finally {
        setLoading(false);
      }
    }

    cargarTipoCambio();
  }, []);

  const setCurrency = (value: Currency) => {
    setCurrencyState(value);
    try {
      sessionStorage.setItem("monedaSeleccionada", value);
    } catch (error) {
      console.error("No se pudo guardar la moneda en sessionStorage:", error);
    }
  };

  const toSelectedCurrency = (usdAmount: number) => {
    if (currency === "CRC") {
      return usdAmount * exchangeRate;
    }
    return usdAmount;
  };

  const formatCurrency = (usdAmount: number, overrideCurrency?: Currency) => {
    const targetCurrency = overrideCurrency ?? currency;
    const amount = targetCurrency === "CRC" ? usdAmount * exchangeRate : usdAmount;

    if (targetCurrency === "CRC") {
      return new Intl.NumberFormat("es-CR", {
        style: "currency",
        currency: "CRC",
        maximumFractionDigits: 0,
      }).format(amount);
    }

    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const value = useMemo(
    () => ({
      currency,
      exchangeRate,
      loading,
      error,
      setCurrency,
      formatCurrency,
      toSelectedCurrency,
    }),
    [currency, exchangeRate, loading, error]
  );

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  return useContext(CurrencyContext);
}
