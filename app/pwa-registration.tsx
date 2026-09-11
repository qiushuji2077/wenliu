"use client";

import { useEffect } from "react";
import { sitePath } from "@/lib/paths";

export function PwaRegistration() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    const register = () => {
      navigator.serviceWorker
        .register(sitePath("/sw.js"), { scope: sitePath("/") })
        .catch(() => undefined);
    };

    window.addEventListener("load", register, { once: true });
    return () => window.removeEventListener("load", register);
  }, []);

  return null;
}
