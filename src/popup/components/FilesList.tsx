import type { MouseEvent } from 'react';
import { isLocalURL, getPathExtension } from '../../shared/utils';
import type { RuleFile, FileExt } from '../../shared/types';

export type EditorFile = RuleFile & { key: string };

interface FilesListProps {
  files: EditorFile[];
  onChange: (files: EditorFile[]) => void;
  onGripMouseDown: (e: MouseEvent) => void;
  onDirty: () => void;
}

let fileKeyCounter = 0;
export function nextFileKey(): string {
  return `f${++fileKeyCounter}`;
}

export function filesFromRule(files: RuleFile[]): EditorFile[] {
  const list = files.map((f) => ({ ...f, key: nextFileKey() }));
  list.push({ key: nextFileKey(), type: '', path: '', ext: '' });
  return list;
}

export function FilesList({
  files,
  onChange,
  onGripMouseDown,
  onDirty,
}: FilesListProps) {
  const updateFile = (index: number, patch: Partial<EditorFile>) => {
    const next = files.map((f, i) => (i === index ? { ...f, ...patch } : f));
    onChange(next);
  };

  const handlePathInput = (index: number, value: string) => {
    let next = [...files];
    const file = { ...next[index] };

    if (!value.length) {
      file.type = '';
      file.ext = '';
      file.path = value;
      next[index] = file;
      onChange(next);
      onDirty();
      return;
    }

    // Append empty row when typing into the last file
    if (index === next.length - 1) {
      next = [...next, { key: nextFileKey(), type: '', path: '', ext: '' }];
    }

    file.path = value;
    file.type = isLocalURL(value.trim()) ? 'local' : 'remote';
    file.ext = getPathExtension(value);
    next[index] = file;
    onChange(next);
    onDirty();
  };

  const handleTypeChange = (index: number, ext: FileExt) => {
    updateFile(index, { ext });
    onDirty();
  };

  const handleDelete = (index: number) => {
    if (files.length <= 1) return;
    const next = [...files];
    next.splice(index, 1);
    onChange(next);
    onDirty();
  };

  return (
    <ul className="files-list unselectable">
      {files.map((file, index) => {
        const title = file.ext
          ? `${file.type} - ${file.ext.toUpperCase()}`
          : 'Unknown (will be skipped)';

        return (
          <li
            key={file.key}
            className="file"
            data-key={file.key}
            data-type={file.type}
            data-ext={file.ext}
          >
            <div
              className="f-grip"
              data-name="do-grip"
              onMouseDown={onGripMouseDown}
            />
            <input
              className="f-input inp"
              data-name="txt-file-path"
              type="text"
              value={file.path}
              placeholder="Local or remote path to the file"
              onChange={(e) => handlePathInput(index, e.target.value)}
            />
            <div className="f-type" data-ext={file.ext}>
              <i className="material-icons" data-for="remote" title="Remote">
                &#xE894;
              </i>
              <i className="material-icons" data-for="local" title="Local">
                &#xE30A;
              </i>
              <select
                data-name="sel-file-type"
                tabIndex={-1}
                value={file.ext || ''}
                title={title}
                onChange={(e) =>
                  handleTypeChange(index, e.target.value as FileExt)
                }
              >
                <option value="" disabled hidden />
                <option value="js" title="JavaScript">
                  JavaScript
                </option>
                <option value="css" title="CSS">
                  CSS
                </option>
                <option value="html" title="HTML">
                  HTML
                </option>
              </select>
            </div>
            <button
              className="f-delete btn material-icons"
              data-name="btn-file-delete"
              tabIndex={-1}
              type="button"
              onClick={() => handleDelete(index)}
            >
              &#xE872;
            </button>
          </li>
        );
      })}
    </ul>
  );
}
