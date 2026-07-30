import { useEffect, useMemo, useState } from 'react';
import type { Rule } from '../../shared/types';
import { downloadText } from '../../shared/utils';

interface ExportModalProps {
  rules: Rule[];
  onDone: (result: 'success' | 'fail') => void;
}

export function ExportModal({ rules, onDone }: ExportModalProps) {
  const [selected, setSelected] = useState<boolean[]>(() =>
    rules.map(() => false)
  );
  const [toggleAll, setToggleAll] = useState(false);

  useEffect(() => {
    setSelected(rules.map(() => false));
    setToggleAll(false);
  }, [rules]);

  const selectedCount = useMemo(
    () => selected.filter(Boolean).length,
    [selected]
  );

  const setOne = (index: number, checked: boolean) => {
    setSelected((prev) => {
      const next = [...prev];
      next[index] = checked;
      return next;
    });
  };

  const setAll = (checked: boolean) => {
    setToggleAll(checked);
    setSelected(rules.map(() => checked));
  };

  const handleExport = () => {
    const selectedRules = rules
      .filter((_, i) => selected[i])
      .map((rule) => JSON.stringify(rule));

    if (!selectedRules.length) return;

    const rulesJSON = '[' + selectedRules.join(',') + ']';

    try {
      JSON.parse(rulesJSON);
      const res = downloadText(
        'code-injector-export-' + Date.now() + '.json',
        rulesJSON
      );
      onDone(res ? 'success' : 'fail');
    } catch {
      onDone('fail');
    }
  };

  return (
    <>
      <div className="export-rulesList">
        {rules.map((rule, index) => (
          <div className="rule" key={index}>
            <label className="cb-custom">
              <input
                type="checkbox"
                data-name="cb-export-toggle"
                checked={!!selected[index]}
                onChange={(e) => setOne(index, e.target.checked)}
              />
              <i className="material-icons">{'\uE835'}</i>
              <i className="material-icons cb-check">{'\uE5CA'}</i>
              <span className="r-name" title={rule.selector}>
                {rule.selector}
              </span>
            </label>
            <textarea
              className="r-json"
              readOnly
              value={JSON.stringify(rule)}
            />
          </div>
        ))}
      </div>
      <div className="export-controls">
        <label className="cb-custom">
          <input
            type="checkbox"
            data-name="cb-export-toggle-all"
            checked={toggleAll}
            onChange={(e) => setAll(e.target.checked)}
          />
          <i className="material-icons">{'\uE835'}</i>
          <i className="material-icons cb-check">{'\uE047'}</i>
          <span className="export-counter-selected">{selectedCount}</span>
          {' / '}
          <span className="export-counter-max">{rules.length}</span> selected
        </label>
        <button
          className="btn btn-primary"
          data-name="btn-export"
          disabled={!selectedCount}
          onClick={handleExport}
        >
          Export
        </button>
      </div>
    </>
  );
}
