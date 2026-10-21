import { Component, type ReactNode } from 'react';

export class SceneBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    if (this.state.failed)
      return (
        <div className="scene-fallback" role="alert">
          <strong>The 3D view couldn’t start.</strong>
          <p>
            Check that hardware acceleration is enabled, then reload. Your last saved moves remain
            on this device.
          </p>
          <button onClick={() => window.location.reload()}>Reload workshop</button>
        </div>
      );
    return this.props.children;
  }
}
