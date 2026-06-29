import { useMemo, useState } from 'react';
import { configFormat, parseConfig, shikiLangFor, type ParseErrorInfo } from '../lib/config-parse';
import type { FileEntry } from '../lib/types';
import { ConfigTree } from './ConfigTree';
import { SourceView } from './SourceView';

interface ConfigViewProps {
  source: string;
  file: FileEntry;
}

export function ConfigView({ source, file }: ConfigViewProps) {
  const format = useMemo(() => configFormat(file.name), [file.name]);
  const outcome = useMemo(() => parseConfig(source, format), [source, format]);
  const [mode, setMode] = useState<'tree' | 'source'>(outcome.ok ? 'tree' : 'source');
  // Bumping the key remounts the tree so a new forceOpen applies to every node.
  const [treeKey, setTreeKey] = useState(0);
  const [forceOpen, setForceOpen] = useState<boolean | undefined>(undefined);

  function expandAll() {
    setForceOpen(true);
    setTreeKey((k) => k + 1);
  }
  function collapseAll() {
    setForceOpen(false);
    setTreeKey((k) => k + 1);
  }

  return (
    <div className="doc-scroll">
      <div className="doc cfg">
        <div className="doc__bar">
          {outcome.ok && mode === 'tree' && (
            <div className="cfg-expand" role="group" aria-label="展開操作">
              <button type="button" className="btn" onClick={expandAll}>
                すべて展開
              </button>
              <button type="button" className="btn" onClick={collapseAll}>
                すべて折りたたみ
              </button>
            </div>
          )}
          {outcome.ok && (
            <div className="seg" role="group" aria-label="表示モード">
              <button
                type="button"
                className={`btn${mode === 'tree' ? ' is-active' : ''}`}
                aria-pressed={mode === 'tree'}
                onClick={() => setMode('tree')}
              >
                ツリー
              </button>
              <button
                type="button"
                className={`btn${mode === 'source' ? ' is-active' : ''}`}
                aria-pressed={mode === 'source'}
                onClick={() => setMode('source')}
              >
                ソース
              </button>
            </div>
          )}
        </div>

        {!outcome.ok && <ErrorBanner format={format} error={outcome.error} />}

        {outcome.ok && mode === 'tree' ? (
          <ConfigTree key={treeKey} value={outcome.value} forceOpen={forceOpen} />
        ) : (
          <SourceView source={source} lang={shikiLangFor(format)} errorLine={outcome.ok ? undefined : outcome.error.line} />
        )}
      </div>
    </div>
  );
}

function ErrorBanner({ format, error }: { format: string; error: ParseErrorInfo }) {
  const where = error.line !== undefined ? `（${error.line} 行${error.column !== undefined ? ` ${error.column} 列` : ''}）` : '';
  return (
    <div className="cfg-error-banner" role="alert">
      <strong>
        {format.toUpperCase()} 構文エラー{where}
      </strong>
      <span className="cfg-error-message">{error.message}</span>
    </div>
  );
}
