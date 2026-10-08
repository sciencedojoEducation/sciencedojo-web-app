"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";

// Optional interactive navigation must not replace a readable public page with
// the root error screen if session hydration or a browser API fails.
export default class PublicNavigationBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[public-navigation]", error, info.componentStack);
  }

  render() {
    if (!this.state.failed) return this.props.children;

    return (
      <header className="border-b border-slate-200 bg-white px-4 py-5">
        <nav aria-label="Main navigation" className="mx-auto flex max-w-6xl flex-wrap items-center gap-6 text-sm font-semibold text-secondary">
          {/* Recovery links use full navigation even if the client router failed. */}
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a href="/" translate="no" className="notranslate mr-auto">ScienceDojo</a>
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a href="/courses">Courses</a>
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a href="/dashboard">Dashboard</a>
        </nav>
      </header>
    );
  }
}
