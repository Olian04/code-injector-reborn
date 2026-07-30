import browser from '../shared/browser';
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MouseEvent,
  type RefObject,
} from 'react';
import {
  getRules,
  getSettings,
  setRules,
  setSettings,
} from '../shared/storage';
import type { Rule, Settings } from '../shared/types';
import { DEFAULT_SETTINGS } from '../shared/types';
import { ExportModal } from './components/ExportModal';
import { ImportModal } from './components/ImportModal';
import { Modal } from './components/Modal';
import './styles/options-ui.scss';

type ModalKind = 'import' | 'export' | null;
type FlashResult = 'success' | 'fail' | null;

const SIZE_MIN_W = 500;
const SIZE_MIN_H = 450;

function useFlash(
  result: FlashResult,
  flashKey: number
): RefObject<HTMLLIElement> {
  const ref = useRef<HTMLLIElement>(null!);

  useEffect(() => {
    if (!result || !ref.current) return;

    const info = ref.current.querySelector('.' + result) as HTMLElement | null;
    if (!info) return;

    info.style.cssText = 'transition: 0s; opacity: 1;';
    const timer = setTimeout(() => {
      info.style.cssText = 'transition: 5s; opacity: 0;';
    }, 2000);

    return () => clearTimeout(timer);
  }, [result, flashKey]);

  return ref;
}

export function App() {
  const [rulesCount, setRulesCount] = useState<number | null>(null);
  const [exportRules, setExportRules] = useState<Rule[]>([]);
  const [settings, setSettingsState] = useState<Settings>(DEFAULT_SETTINGS);
  const [sizeWidth, setSizeWidth] = useState('');
  const [sizeHeight, setSizeHeight] = useState('');
  const [modal, setModal] = useState<ModalKind>(null);
  const [clearConfirm, setClearConfirm] = useState(false);
  const [importResult, setImportResult] = useState<FlashResult>(null);
  const [importDetail, setImportDetail] = useState('');
  const [importFlashKey, setImportFlashKey] = useState(0);
  const [exportResult, setExportResult] = useState<FlashResult>(null);
  const [exportFlashKey, setExportFlashKey] = useState(0);

  const importLiRef = useFlash(importResult, importFlashKey);
  const exportLiRef = useFlash(exportResult, exportFlashKey);

  const refreshRulesCounter = useCallback(async (rules?: Rule[]) => {
    if (rules) {
      setRulesCount(rules.length);
      return;
    }
    const list = await getRules();
    setRulesCount(list.length);
  }, []);

  const persistSettings = useCallback(async (next: Settings) => {
    const toSave: Settings = {
      ...next,
      nightmode: false,
      size: {
        width: Math.max(SIZE_MIN_W, next.size.width | 0),
        height: Math.max(SIZE_MIN_H, next.size.height | 0),
      },
    };
    setSettingsState(toSave);
    await setSettings(toSave);
  }, []);

  useEffect(() => {
    document.body.classList.add('unselectable');

    void (async () => {
      await refreshRulesCounter();
      const loaded = await getSettings();
      setSettingsState(loaded);
      setSizeWidth(String(loaded.size.width));
      setSizeHeight(String(loaded.size.height));
    })();

    const onChanged = (changes: {
      rules?: { newValue?: Rule[] };
    }) => {
      if (changes.rules && changes.rules.newValue) {
        void refreshRulesCounter(changes.rules.newValue);
      }
      setModal(null);
    };

    browser.storage.onChanged.addListener(onChanged);
    return () => {
      browser.storage.onChanged.removeListener(onChanged);
    };
  }, [refreshRulesCounter]);

  useEffect(() => {
    if (modal) {
      document.body.dataset.modalvisible = 'true';
    } else {
      delete document.body.dataset.modalvisible;
    }
  }, [modal]);

  const closeModal = () => setModal(null);

  const handleClearRules = async (e: MouseEvent<HTMLButtonElement>) => {
    const target = e.currentTarget;
    if (clearConfirm) {
      setClearConfirm(false);
      setRulesCount(null);
      await setRules([]);
      await refreshRulesCounter([]);
    } else {
      setClearConfirm(true);
      target.onmouseleave = () => {
        target.onmouseleave = null;
        setClearConfirm(false);
      };
    }
  };

  const openExport = async () => {
    const rules = await getRules();
    setExportRules(rules);
    setModal('export');
  };

  const openImport = () => setModal('import');

  const handleShowCounter = (checked: boolean) => {
    void persistSettings({ ...settings, showcounter: checked });
  };

  const handleNightMode = (_checked: boolean) => {
    // Original always persisted nightmode as false (feature hidden).
    void persistSettings({ ...settings, nightmode: false });
  };

  const commitSize = (which: 'width' | 'height', raw: string) => {
    let width = Number(sizeWidth) | 0;
    let height = Number(sizeHeight) | 0;

    if (which === 'width') {
      if (raw) {
        width = Math.max(SIZE_MIN_W, Number(raw) | 0);
        setSizeWidth(String(width));
      } else {
        width = Number(raw) | 0;
      }
    } else if (raw) {
      height = Math.max(SIZE_MIN_H, Number(raw) | 0);
      setSizeHeight(String(height));
    } else {
      height = Number(raw) | 0;
    }

    const next: Settings = {
      ...settings,
      size: {
        width: Math.max(SIZE_MIN_W, width),
        height: Math.max(SIZE_MIN_H, height),
      },
    };
    void persistSettings(next);
  };

  const onSizeInput = (which: 'width' | 'height', raw: string) => {
    const digits = raw.replace(/\D/g, '');
    if (which === 'width') setSizeWidth(digits);
    else setSizeHeight(digits);
  };

  return (
    <>
      <div id="body">
        <table id="options-list" className="unselectable">
          <tbody>
            <tr className="opt-rules">
              <td>Saved rules:</td>
              <td>
                <span id="rules-counter">
                  {rulesCount === null ? '' : rulesCount}
                </span>
                <button
                  className="btn btn-error-hover"
                  data-name="btn-clear-rules"
                  title="Remove all the rules"
                  data-confirm={clearConfirm ? 'true' : undefined}
                  onClick={handleClearRules}
                >
                  Clean
                </button>
              </td>
            </tr>

            <tr className="spacer">
              <td colSpan={2} />
            </tr>

            <tr className="opt-export-import">
              <td>
                Export / Import:
                <small className="description">
                  Export your current rules list <br />
                  or import a saved one.
                </small>
              </td>
              <td>
                <ul>
                  <li
                    className="opt-ei-import"
                    ref={importLiRef}
                    data-result={importResult || undefined}
                  >
                    <button
                      className="btn"
                      data-name="btn-show-modal-import"
                      title="Import"
                      onClick={openImport}
                    >
                      Import
                    </button>
                    <div className="import-info success">
                      <span className="material-icons">{'\uE876'}</span>
                      Success <small>{importDetail}</small>
                    </div>
                    <div className="import-info fail">
                      <span className="material-icons">{'\uE5CD'}</span>
                      Failed <small>{importDetail}</small>
                    </div>
                  </li>
                  <li
                    className="opt-ei-export"
                    ref={exportLiRef}
                    data-result={exportResult || undefined}
                  >
                    <button
                      className="btn"
                      data-name="btn-show-modal-export"
                      title="Export"
                      onClick={() => void openExport()}
                    >
                      Export
                    </button>
                    <div className="export-info success">
                      <span className="material-icons">{'\uE876'}</span>
                      Success
                    </div>
                    <div className="export-info fail">
                      <span className="material-icons">{'\uE5CD'}</span>
                      Failed
                    </div>
                  </li>
                </ul>
              </td>
            </tr>

            <tr className="opt-size">
              <td>
                Size:
                <small className="description">
                  Set the default size of the <br />
                  popup window.
                </small>
              </td>
              <td>
                <ul>
                  <li>
                    <input
                      type="text"
                      className="inp"
                      data-name="inp-size-width"
                      data-min={String(SIZE_MIN_W)}
                      placeholder="500"
                      title="Width"
                      value={sizeWidth}
                      onChange={(e) => onSizeInput('width', e.target.value)}
                      onBlur={(e) => commitSize('width', e.target.value)}
                    />
                    <small>x</small>
                    <input
                      type="text"
                      className="inp"
                      data-name="inp-size-height"
                      data-min={String(SIZE_MIN_H)}
                      placeholder="450"
                      title="Height"
                      value={sizeHeight}
                      onChange={(e) => onSizeInput('height', e.target.value)}
                      onBlur={(e) => commitSize('height', e.target.value)}
                    />
                  </li>
                  <li />
                </ul>
              </td>
            </tr>

            <tr className="opt-nightmode" style={{ display: 'none' }}>
              <td>
                Night mode:
                <small className="description">
                  Does not fit well with your dark theme? <br />
                  Try out the night mode!
                </small>
              </td>
              <td>
                <label className="cbk">
                  <input
                    type="checkbox"
                    data-name="cb-night-mode"
                    name="nightmode"
                    checked={settings.nightmode}
                    onChange={(e) => handleNightMode(e.target.checked)}
                  />
                </label>
              </td>
            </tr>

            <tr className="opt-counter">
              <td>
                Show counter:
                <small className="description">
                  A little badget over the addon icon which <br />
                  show how many rules has been injected <br />
                  into the current page.
                </small>
              </td>
              <td>
                <label className="cbk">
                  <input
                    type="checkbox"
                    data-name="cb-show-counter"
                    name="showcounter"
                    checked={settings.showcounter}
                    onChange={(e) => handleShowCounter(e.target.checked)}
                  />
                </label>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <Modal
        title={modal === 'export' ? 'Export' : modal === 'import' ? 'Import' : ''}
        visible={modal !== null}
        onClose={closeModal}
      >
        {modal === 'export' && (
          <ExportModal
            rules={exportRules}
            onDone={(result) => {
              setExportResult(result);
              setExportFlashKey((k) => k + 1);
              closeModal();
            }}
          />
        )}
        {modal === 'import' && (
          <ImportModal
            onDone={(result, detail) => {
              setImportResult(result);
              setImportDetail(detail);
              setImportFlashKey((k) => k + 1);
              closeModal();
            }}
          />
        )}
      </Modal>

      <div className="hidden">
        <span className="material-icons">{'\uE876'}</span>
        <span className="material-icons">{'\uE5CD'}</span>
      </div>
    </>
  );
}
