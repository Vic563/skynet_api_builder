import { useEffect, useMemo, useRef, useState, memo, useCallback } from 'react';
import YAML from 'js-yaml';
import type { WorkflowSnippet } from '../types';
import { workflows } from '../data/workflows';
import {
  buildWorkflowSnippets,
  defaultWorkflowInputs,
  extractWorkflowInputs,
  getWorkflowInputHint,
} from '../utils/workflows';
import { useMultiCopyToClipboard } from '../hooks/useCopyToClipboard';
import { useDebounce } from '../hooks/useDebounce';

const FORMAT_STORAGE_KEY = 'workflow-output-format';

// Memoized workflow step component
const WorkflowStepCard = memo(function WorkflowStepCard({
  snippet,
  format,
  copyState,
  onCopy,
}: {
  snippet: WorkflowSnippet;
  format: 'yaml' | 'json';
  copyState: 'idle' | 'copied' | 'error';
  onCopy: (stepId: string, content: string) => void;
}) {
  const content = format === 'yaml' ? snippet.yaml : snippet.json;
  const queryPayload = snippet.request.query ?? {};
  const bodyPayload = snippet.request.body ?? {};
  const hasQuery = Object.keys(queryPayload).length > 0;
  const hasBody = Object.keys(bodyPayload).length > 0;

  // Memoize the formatted payloads
  const formattedQuery = useMemo(
    () =>
      format === 'yaml'
        ? YAML.dump(queryPayload, { skipInvalid: true, lineWidth: -1, noRefs: true })
        : JSON.stringify(queryPayload, null, 2),
    [queryPayload, format],
  );

  const formattedBody = useMemo(
    () =>
      format === 'yaml'
        ? YAML.dump(bodyPayload, { skipInvalid: true, lineWidth: -1, noRefs: true })
        : JSON.stringify(bodyPayload, null, 2),
    [bodyPayload, format],
  );

  const handleCopy = useCallback(() => {
    onCopy(snippet.stepId, content);
  }, [onCopy, snippet.stepId, content]);

  return (
    <div className="workflow-step-yaml">
      <div className="workflow-step-header">
        <h4 className="workflow-step-title">{snippet.stepLabel}</h4>
        <button
          type="button"
          className={`btn-copy ${copyState}`}
          onClick={handleCopy}
        >
          {copyState === 'copied'
            ? 'Copied!'
            : copyState === 'error'
              ? 'Error'
              : `Copy ${format.toUpperCase()}`}
        </button>
      </div>
      <div className="workflow-call-meta">
        <span className={`method-pill ${snippet.request.method.toLowerCase()}`}>
          {snippet.request.method}
        </span>
        <span className="endpoint-path">{snippet.request.endpoint}</span>
      </div>
      {(hasQuery || hasBody) && (
        <div className="workflow-request-sections">
          <div className="request-sections-header">
            <span className="request-sections-label">Your Inputs (preview only)</span>
          </div>
          {hasQuery && (
            <div className="request-block">
              <strong>Query Parameters</strong>
              <pre>
                <code>{formattedQuery}</code>
              </pre>
            </div>
          )}
          {hasBody && (
            <div className="request-block">
              <strong>Request Body</strong>
              <pre>
                <code>{formattedBody}</code>
              </pre>
            </div>
          )}
        </div>
      )}
      <div className="workflow-api-call-section">
        <div className="api-call-header">
          <span className="api-call-label">Full API Call (copied to clipboard)</span>
        </div>
        <pre>
          <code>{content}</code>
        </pre>
      </div>
    </div>
  );
});

export function WorkflowView() {
  const [selectedWorkflowId, setSelectedWorkflowId] = useState(() => (workflows[0] ? workflows[0].id : ''));
  const [inputs, setInputs] = useState<Record<string, string>>(() => defaultWorkflowInputs());
  const [menuOpen, setMenuOpen] = useState(false);
  const [format, setFormat] = useState<'yaml' | 'json'>(() => {
    if (typeof window === 'undefined') return 'yaml';
    const stored = window.localStorage.getItem(FORMAT_STORAGE_KEY);
    return stored === 'json' ? 'json' : 'yaml';
  });
  const selectorRef = useRef<HTMLDivElement | null>(null);

  // Use optimized clipboard hook
  const { getCopyState, copyText } = useMultiCopyToClipboard();

  const workflow = useMemo(
    () => workflows.find((wf) => wf.id === selectedWorkflowId) || workflows[0],
    [selectedWorkflowId],
  );

  const requiredFields = useMemo(
    () => extractWorkflowInputs(workflow),
    [workflow],
  );

  useEffect(() => {
    const defaults = defaultWorkflowInputs();
    const nextInputs: Record<string, string> = {};
    requiredFields.forEach((field) => {
      const normalized = field;
      if (defaults[normalized] !== undefined) {
        nextInputs[normalized] = defaults[normalized];
      } else {
        nextInputs[normalized] = '';
      }
    });
    setInputs(nextInputs);
  }, [selectedWorkflowId, requiredFields]);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (selectorRef.current && !selectorRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(FORMAT_STORAGE_KEY, format);
  }, [format]);

  // Debounce inputs to prevent excessive recalculation
  const debouncedInputs = useDebounce(inputs, 200);

  // Memoize snippets with debounced inputs
  const snippets: WorkflowSnippet[] = useMemo(
    () => buildWorkflowSnippets(workflow, debouncedInputs),
    [workflow, debouncedInputs],
  );

  // Memoize input hints
  const inputHints = useMemo(() => {
    const hints: Record<string, string> = {};
    requiredFields.forEach((field) => {
      hints[field] = getWorkflowInputHint(workflow, field);
    });
    return hints;
  }, [workflow, requiredFields]);

  const handleInputChange = useCallback((field: string, value: string) => {
    setInputs((prev) => ({ ...prev, [field]: value }));
  }, []);

  // Check if warning banner should show
  const showMutualExclusivityWarning = useMemo(
    () =>
      workflow.steps.some((step) => step.path === '/api/v4/sdn/arista/switch/sync_config') &&
      inputs.device_id &&
      inputs.sync_hostname,
    [workflow.steps, inputs.device_id, inputs.sync_hostname],
  );

  return (
    <div className="workspace">
      <div className="workspace-left">
        <div className="endpoint-form">
          <header className="endpoint-header">
            <div className="endpoint-meta">
              <span className="endpoint-path">Workflow</span>
            </div>
            <h1 className="endpoint-title">{workflow.name}</h1>
          </header>
          <div className="workflow-selector" ref={selectorRef}>
            <label className="field-label">
              <span className="field-name">Select workflow</span>
            </label>
            <button
              type="button"
              className="workflow-select-trigger"
              onClick={() => setMenuOpen((open) => !open)}
            >
              <span>{workflow.name}</span>
              <span className="chevron">▾</span>
            </button>
            {menuOpen && (
              <div className="workflow-select-menu">
                {workflows.map((wf) => (
                  <button
                    type="button"
                    key={wf.id}
                    className={`workflow-select-option ${wf.id === selectedWorkflowId ? 'active' : ''}`}
                    onClick={() => {
                      setSelectedWorkflowId(wf.id);
                      setMenuOpen(false);
                    }}
                  >
                    {wf.name}
                  </button>
                ))}
              </div>
            )}
          </div>
          <p>{workflow.description}</p>

          {showMutualExclusivityWarning && (
            <div className="warning-banner" style={{
              padding: 'var(--space-3)',
              marginBottom: 'var(--space-4)',
              backgroundColor: 'rgba(245, 158, 11, 0.1)',
              border: '1px solid var(--color-warning)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--color-warning)',
              fontSize: '0.875rem'
            }}>
              <strong>Note:</strong> Both <code>device_id</code> and <code>sync_hostname</code> cannot be used together for sync fabric API calls. If both are provided, <code>device_id</code> will be used and <code>sync_hostname</code> will be excluded from the request.
            </div>
          )}

          <div className="form-controls">
            {requiredFields.length ? (
              <div className="fields-grid">
                {requiredFields.map((field) => (
                  <div className="form-field" key={field}>
                    <label className="field-label">
                      <span className="field-name">{field}</span>
                    </label>
                    <div className="input-wrapper">
                      <input
                        value={inputs[field] ?? ''}
                        onChange={(e) => handleInputChange(field, e.target.value)}
                      />
                    </div>
                    {inputHints[field] && (
                      <small className="field-hint">{inputHints[field]}</small>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="empty-state">No inputs required for this workflow.</p>
            )}
          </div>
          <ol className="workflow-steps-list">
            {workflow.steps.map((step) => (
              <li key={step.id} className="workflow-step-item">
                <strong>{step.label}</strong>
                {step.description && <p>{step.description}</p>}
              </li>
            ))}
          </ol>
        </div>
      </div>
      <div className="workspace-right">
        <div className="yaml-preview">
          <div className="preview-header">
            <h3>Workflow Steps</h3>
            <div className="format-toggle">
              <span className="field-name">Output</span>
              <div className="format-toggle-buttons">
                <button
                  type="button"
                  className={`btn btn-secondary ${format === 'yaml' ? 'active' : ''}`}
                  onClick={() => setFormat('yaml')}
                >
                  YAML
                </button>
                <button
                  type="button"
                  className={`btn btn-secondary ${format === 'json' ? 'active' : ''}`}
                  onClick={() => setFormat('json')}
                >
                  JSON
                </button>
              </div>
            </div>
          </div>
          <div className="preview-content">
            {snippets.map((snippet) => (
              <WorkflowStepCard
                key={snippet.stepId}
                snippet={snippet}
                format={format}
                copyState={getCopyState(snippet.stepId)}
                onCopy={copyText}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
