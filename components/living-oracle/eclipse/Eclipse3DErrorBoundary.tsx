"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";

export class Eclipse3DErrorBoundary extends Component<
  { children: ReactNode; onError: () => void },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(_error: Error, _info: ErrorInfo) {
    void _error;
    void _info;
    this.props.onError();
  }
  render() { return this.state.failed ? null : this.props.children; }
}
