import type { UseFormReturn } from 'react-hook-form';
import type { Endpoint } from '../types';
import { normalizeName, hintFor, defaultsFromExample } from '../utils/helpers';

interface EndpointFormProps {
    selected: Endpoint;
    form: UseFormReturn<Record<string, unknown>>;
    onSubmit: () => void;
    showOptional: boolean;
    setShowOptional: (show: boolean) => void;
}

export function EndpointForm({ selected, form, onSubmit, showOptional, setShowOptional }: EndpointFormProps) {
    const hasOptional = selected.params.some((p) => !p.required);
    const formValues = form.watch();
    const isSyncConfig = selected.path === '/api/v4/sdn/arista/switch/sync_config';
    const hasDeviceId = Boolean(formValues.device_id);
    const hasHostname = Boolean(formValues.hostname);
    const showMutualExclusiveWarning = isSyncConfig && hasDeviceId && hasHostname;

    return (
        <div className="endpoint-form">
            <header className="endpoint-header">
                <div className="endpoint-meta">
                    <span className={`method-pill ${selected.method.toLowerCase()}`}>{selected.method}</span>
                    <span className="endpoint-path">{selected.path}</span>
                </div>
                <h1 className="endpoint-title">{selected.title}</h1>
            </header>

            <div className="form-controls">
                {hasOptional && (
                    <label className="toggle-control">
                        <input
                            type="checkbox"
                            checked={showOptional}
                            onChange={(e) => setShowOptional(e.target.checked)}
                        />
                        <span className="toggle-label">Show optional fields</span>
                    </label>
                )}
            </div>

            <form onSubmit={onSubmit} className="param-form">
                {selected.params.filter((p) => p.required).length === 0 && !showOptional && (
                    <p className="empty-state">No required parameters. Toggle optional fields to see more.</p>
                )}

                {showMutualExclusiveWarning && (
                    <div className="warning-banner" style={{
                        padding: 'var(--space-3)',
                        marginBottom: 'var(--space-4)',
                        backgroundColor: 'rgba(245, 158, 11, 0.1)',
                        border: '1px solid var(--color-warning)',
                        borderRadius: 'var(--radius-md)',
                        color: 'var(--color-warning)',
                        fontSize: '0.875rem'
                    }}>
                        ⚠️ <strong>Note:</strong> Both <code>device_id</code> and <code>hostname</code> cannot be used together for sync fabric API calls. If both are provided, <code>device_id</code> will be used and <code>hostname</code> will be excluded from the request.
                    </div>
                )}

                <div className="fields-grid">
                    {selected.params
                        .filter((param) => param.required || showOptional)
                        .map((param) => (
                            <div key={param.name} className="form-field">
                                <label className="field-label">
                                    <span className="field-name">{normalizeName(param.name)}</span>
                                    {param.required && <span className="required-mark">*</span>}
                                </label>
                                <div className="input-wrapper">
                                    <input
                                        {...form.register(normalizeName(param.name))}
                                        placeholder={param.description}
                                        className={form.formState.errors[normalizeName(param.name)] ? 'error' : ''}
                                    />
                                </div>
                                <small className="field-hint">{hintFor(param, selected)}</small>
                                {form.formState.errors[normalizeName(param.name)] && (
                                    <span className="error-msg">Invalid value</span>
                                )}
                            </div>
                        ))}
                </div>

                <div className="form-actions">
                    <button type="submit" className="btn btn-primary">
                        Generate YAML
                    </button>
                    <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => form.reset(defaultsFromExample(selected))}
                    >
                        Reset Defaults
                    </button>
                </div>
            </form>
        </div>
    );
}
