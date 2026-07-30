interface InfoOverlayProps {
  version: string;
  onHide: () => void;
}

export function InfoOverlay({ version, onHide }: InfoOverlayProps) {
  return (
    <div id="info">
      <div className="info">
        <div className="info-header">
          <div className="ih-logo" />
          <div className="ih-title" data-version={version ? `v${version}` : undefined}>
            Code Injector
          </div>
        </div>
        <div className="info-content">
          <h4>
            Hello there! <i className="material-icons">&#xE24E;</i>
          </h4>
          <p>
            A minimum of knowledge of web programming is required to be able to
            properly use this addon.
          </p>
          <p>
            Visit the{' '}
            <a
              href="https://github.com/Lor-Saba/Code-Injector"
              target="_blank"
              rel="noreferrer"
            >
              github page
            </a>{' '}
            for some documentation to better understand the addon mechanics.{' '}
          </p>
          <p>Happy Injection ;)</p>
          <p>~ L.Sabatelli</p>
        </div>
        <div className="info-controls">
          <button
            className="btn btn-icon material-icons"
            data-name="btn-info-hide"
            title="Close"
            type="button"
            onClick={onHide}
          >
            &#xE5CD;
          </button>
        </div>
      </div>
    </div>
  );
}
