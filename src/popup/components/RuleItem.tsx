import type { MouseEvent } from 'react';
import { containsCode } from '../../shared/utils';
import type { RuleView } from '../types';
import { ruleMatchesTab } from '../types';
import type { TabData } from '../../shared/types';

interface RuleItemProps {
  rule: RuleView;
  tabData: Pick<TabData, 'topURL' | 'innerURLs'>;
  actionVisible: boolean;
  removing?: boolean;
  onActionClick: (e: MouseEvent, ruleId: number) => void;
  onGripMouseDown: (e: MouseEvent) => void;
}

export function RuleItem({
  rule,
  tabData,
  actionVisible,
  removing,
  onActionClick,
  onGripMouseDown,
}: RuleItemProps) {
  const { active, innerActive } = ruleMatchesTab(
    rule.selector,
    rule.topFrameOnly,
    tabData
  );

  return (
    <li
      className="rule"
      data-enabled={String(rule.enabled)}
      data-onload={String(rule.onLoad)}
      data-topframeonly={String(rule.topFrameOnly)}
      data-id={String(rule.id)}
      data-active={String(active)}
      data-inner-active={String(innerActive)}
      data-actionvisible={actionVisible ? 'true' : undefined}
      data-removing={removing ? 'true' : undefined}
    >
      <div className="r-name" data-name="do-grip" onMouseDown={onGripMouseDown}>
        {rule.selector}
      </div>
      <div className="r-details">
        <ul>
          <li title="JavaScript">
            <div
              className="d-info color-js"
              data-active={String(containsCode(rule.code.js))}
            />
          </li>
          <li title="CSS">
            <div
              className="d-info color-css"
              data-active={String(containsCode(rule.code.css))}
            />
          </li>
          <li title="HTML">
            <div
              className="d-info color-html"
              data-active={String(containsCode(rule.code.html))}
            />
          </li>
          <li title="Files">
            <div
              className="d-info color-files"
              data-active={String(rule.code.files.length > 0)}
            />
          </li>
        </ul>
      </div>
      <div className="r-controls">
        <i
          className="material-icons"
          data-name="btn-rule-action"
          title="Actions"
          onClick={(e) => onActionClick(e, rule.id)}
        >
          &#xE5CF;
        </i>
      </div>
      <div className="r-data">
        <textarea className="d-js" readOnly value={rule.code.js} />
        <textarea className="d-css" readOnly value={rule.code.css} />
        <textarea className="d-html" readOnly value={rule.code.html} />
        <textarea
          className="d-files"
          readOnly
          value={JSON.stringify(rule.code.files)}
        />
      </div>
    </li>
  );
}
