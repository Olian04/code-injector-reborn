import browser from '../../shared/browser';
import { lazy, Suspense, useEffect, useState } from 'react';

const OptionsApp = lazy(() =>
  import('../../options/App').then((mod) => ({ default: mod.App }))
);

/** Warm options chunk on intent (bundle-preload). */
export function preloadOptionsApp() {
  void import('../../options/App');
}

interface OptionsPanelProps {
  active: boolean;
  onHide: () => void;
}

export function OptionsPanel({ active, onHide }: OptionsPanelProps) {
  // Keep the chunk mounted after the first open so re-opening is instant.
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (active) setMounted(true);
  }, [active]);

  return (
    <div id="options">
      <div className="options-frame">
        {mounted && (
          <Suspense fallback={<div className="options-loading" />}>
            <OptionsApp
              embedded
              active={active}
              onOpenStandalone={() => {
                void browser.runtime.openOptionsPage();
              }}
            />
          </Suspense>
        )}
        <div className="options-controls">
          <button
            className="btn btn-icon material-icons"
            data-name="btn-options-hide"
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
