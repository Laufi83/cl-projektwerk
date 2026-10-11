"use client";
import { Component, type ReactNode } from "react";

type Props = { children: ReactNode; fallback?: ReactNode; onError?: (error: unknown) => void };

/**
 * Fängt Fehler einzelner Bausteine ab (z. B. WebGL-Kontext nicht verfügbar, Nachladen eines
 * Code-Pakets fehlgeschlagen), damit nicht die ganze Seite ausfällt.
 */
export class ErrorBoundary extends Component<Props, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error: unknown) {
    console.error(error);
    this.props.onError?.(error);
  }
  render() { return this.state.failed ? (this.props.fallback ?? null) : this.props.children; }
}
