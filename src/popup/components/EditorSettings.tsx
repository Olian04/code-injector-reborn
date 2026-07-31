import { useRef } from 'react';
import {
  EnabledHelp,
  OnPageLoadHelp,
  TopFrameOnlyHelp,
} from './EditorHelp';

interface EditorSettingsProps {
  enabled: boolean;
  onLoad: boolean;
  topFrameOnly: boolean;
  onEnabledChange: (v: boolean) => void;
  onOnLoadChange: (v: boolean) => void;
  onTopFrameOnlyChange: (v: boolean) => void;
}

function boolFromSelect(value: string): boolean {
  return value === 'true';
}

export function EditorSettings({
  enabled,
  onLoad,
  topFrameOnly,
  onEnabledChange,
  onOnLoadChange,
  onTopFrameOnlyChange,
}: EditorSettingsProps) {
  const enabledRef = useRef<HTMLLabelElement>(null);
  const onLoadRef = useRef<HTMLLabelElement>(null);
  const topFrameOnlyRef = useRef<HTMLLabelElement>(null);

  return (
    <div className="editor-settings">
      <label
        ref={enabledRef}
        className="editor-settings-field"
        aria-describedby="help-enabled"
      >
        <span className="editor-settings-label">Enabled</span>
        <select
          className="inp"
          data-name="sel-editor-enabled"
          value={String(enabled)}
          onChange={(e) => onEnabledChange(boolFromSelect(e.target.value))}
        >
          <option value="true">Enabled</option>
          <option value="false">Disabled</option>
        </select>
      </label>
      <EnabledHelp anchorRef={enabledRef} />

      <label
        ref={onLoadRef}
        className="editor-settings-field"
        aria-describedby="help-onpageload"
      >
        <span className="editor-settings-label">On page load</span>
        <select
          className="inp"
          data-name="sel-editor-onload"
          value={String(onLoad)}
          onChange={(e) => onOnLoadChange(boolFromSelect(e.target.value))}
        >
          <option value="true">On page load</option>
          <option value="false">As soon as possible</option>
        </select>
      </label>
      <OnPageLoadHelp anchorRef={onLoadRef} />

      <label
        ref={topFrameOnlyRef}
        className="editor-settings-field"
        aria-describedby="help-topframeonly"
      >
        <span className="editor-settings-label">Top frame only</span>
        <select
          className="inp"
          data-name="sel-editor-topframeonly"
          value={String(topFrameOnly)}
          onChange={(e) => onTopFrameOnlyChange(boolFromSelect(e.target.value))}
        >
          <option value="true">Top frame only</option>
          <option value="false">All frames</option>
        </select>
      </label>
      <TopFrameOnlyHelp anchorRef={topFrameOnlyRef} />
    </div>
  );
}
