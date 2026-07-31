import type { RefObject } from 'react';
import { HelpPopover } from './HelpPopover';

interface HelpProps {
  anchorRef: RefObject<HTMLElement>;
}

interface Token {
  pattern: string;
  meaning: string;
}

const TOKENS: Token[] = [
  { pattern: '.*', meaning: 'any text, including none' },
  { pattern: '^', meaning: 'start of the address' },
  { pattern: '$', meaning: 'end of the address' },
  { pattern: '\\.', meaning: 'a literal dot' },
  { pattern: '(…)?', meaning: 'an optional group' },
  { pattern: 'a|b', meaning: 'either a or b' },
  { pattern: '[^/]', meaning: 'anything but a slash' },
  { pattern: '\\d', meaning: 'any digit' },
];

const EXAMPLES: Token[] = [
  {
    pattern: '^https://example\\.com/',
    meaning: 'that site only, over https',
  },
  {
    pattern: '^https://(www\\.)?example\\.com/blog/',
    meaning: 'one section, with or without www',
  },
  {
    pattern: '^https?://[^/]*\\.example\\.com/',
    meaning: 'any subdomain',
  },
  { pattern: '\\.pdf($|\\?)', meaning: 'addresses ending in .pdf' },
];

function Rows({ rows }: { rows: Token[] }) {
  return (
    <table className="hp-table">
      <tbody>
        {rows.map((row) => (
          <tr key={row.pattern}>
            <td>
              <code>{row.pattern}</code>
            </td>
            <td>{row.meaning}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function SelectorHelp({ anchorRef }: HelpProps) {
  return (
    <HelpPopover id="help-selector" heading="URL pattern" anchorRef={anchorRef}>
      <p>
        A JavaScript regular expression, matched against each frame's address.
        It is a search rather than a whole-address match, and it is
        case-sensitive.
      </p>
      <Rows rows={TOKENS} />
      <p className="hp-subheading">Examples</p>
      <Rows rows={EXAMPLES} />
      <p>
        Anchor with <code>^</code> when a rule should be limited to one site:{' '}
        <code>example\.com</code> on its own also matches{' '}
        <code>other.test/?r=example.com</code>.
      </p>
    </HelpPopover>
  );
}

export function OnPageLoadHelp({ anchorRef }: HelpProps) {
  return (
    <HelpPopover
      id="help-onpageload"
      heading="On page load"
      anchorRef={anchorRef}
    >
      <p>
        <strong>Checked:</strong> wait for the page's load event — markup,
        images, stylesheets and its own scripts have all finished — then inject.
        Choose this when the code looks for elements on the page.
      </p>
      <p>
        <strong>Unchecked:</strong> inject as soon as the navigation commits,
        before the document is parsed. The page may still be empty, so a
        selector can come back with nothing, but the code runs before the
        page's own scripts do.
      </p>
    </HelpPopover>
  );
}

export function TopFrameOnlyHelp({ anchorRef }: HelpProps) {
  return (
    <HelpPopover
      id="help-topframeonly"
      heading="Top frame only"
      anchorRef={anchorRef}
    >
      <p>
        <strong>Checked:</strong> inject only into the page in the address bar.
      </p>
      <p>
        <strong>Unchecked:</strong> also inject into iframes on that page. Each
        frame is matched on its own address, not the address of the page around
        it, so the URL pattern has to match the iframe's URL for it to apply.
      </p>
    </HelpPopover>
  );
}
