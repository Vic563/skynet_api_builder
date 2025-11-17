import { useEffect, useMemo, useState } from 'react';
import YAML from 'js-yaml';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import specFile from './data/skynetSpec.json';
import type { Endpoint, Parameter, SpecFile } from './types';
import './App.css';

const spec = specFile as SpecFile;

const normalizeName = (name: string) =>
  name
    .replace(/\\_/g, '_')
    .replace(/[`]/g, '')
    .replace(/[<>]/g, '')
    .replace(/[:;,]$/g, '')
    .trim()
    .replace(/\s+/g, '_');

function buildSchema(endpoint: Endpoint) {
  const shape: Record<string, z.ZodTypeAny> = {};
  endpoint.params.forEach((param) => {
    const base = z.any();
    const key = normalizeName(param.name);
    shape[key] = param.required ? base : base.optional();
  });
  return z.object(shape);
}

function defaultsFromExample(endpoint: Endpoint) {
  if (endpoint.example && typeof endpoint.example === 'object' && !Array.isArray(endpoint.example)) {
    const defaults: Record<string, unknown> = {};
    endpoint.params.forEach((p) => {
      const key = normalizeName(p.name);
      const exampleObj = endpoint.example as Record<string, unknown>;
      if (!p.required) return; // leave optional empty by default
      if (Object.prototype.hasOwnProperty.call(exampleObj, p.name)) {
        defaults[key] = exampleObj[p.name];
      } else if (Object.prototype.hasOwnProperty.call(exampleObj, key)) {
        defaults[key] = exampleObj[key];
      }
    });
    // Prefer SDN2 by default if not already set
    if (endpoint.params.some((p) => normalizeName(p.name) === 'sdn_version') && defaults.sdn_version === undefined) {
      defaults.sdn_version = 2;
    }
    return defaults;
  }
  const defaults: Record<string, unknown> = {};
  if (endpoint.params.some((p) => normalizeName(p.name) === 'sdn_version')) {
    defaults.sdn_version = 2;
  }
  return defaults;
}

function exampleFor(endpoint: Endpoint, paramName: string) {
  const key = normalizeName(paramName);
  const ex = endpoint.example as Record<string, unknown> | undefined;
  if (!ex) return undefined;
  if (Object.prototype.hasOwnProperty.call(ex, paramName)) return ex[paramName];
  if (Object.prototype.hasOwnProperty.call(ex, key)) return ex[key];
  return undefined;
}

function hintFor(param: Parameter, endpoint: Endpoint) {
  const ex = exampleFor(endpoint, param.name);
  const name = normalizeName(param.name);
  if (name === 'sdn_version') {
    const base = 'Defaulting to 2 (SDN2). Use 1 only for legacy/SDN1 fabrics.';
    if (ex !== undefined) return `${base} Example: ${String(ex)}`;
    return base;
  }
  if (ex !== undefined) return `Example: ${String(ex)}`;
  const desc = param.description?.trim();
  if (desc) return desc;
  return param.required ? 'Required' : 'Optional';
}

function cleanPayload(payload: Record<string, unknown>) {
  const cleaned: Record<string, unknown> = {};
  Object.entries(payload).forEach(([key, value]) => {
    if (value === '' || value === undefined || value === null) return;
    cleaned[key] = value;
  });
  return cleaned;
}

function App() {
  const endpoints = useMemo(() => spec.endpoints, []);
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState(() => (endpoints.length ? endpoints[0].id : ''));
  const [yamlText, setYamlText] = useState('');
  const [showOptional, setShowOptional] = useState(false);
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'error'>('idle');

  const filtered = useMemo(
    () => endpoints.filter((ep) => !query || matchesSearch(ep, query)),
    [endpoints, query],
  );

  useEffect(() => {
    if (!filtered.length) return;
    if (!filtered.some((ep) => ep.id === selectedId)) {
      setSelectedId(filtered[0].id);
    }
  }, [filtered, selectedId]);

  const selected = filtered.find((e) => e.id === selectedId) || filtered[0];

  const grouped = useMemo(() => {
    return filtered.reduce<Record<string, Endpoint[]>>((acc, ep) => {
      acc[ep.section] = acc[ep.section] || [];
      acc[ep.section].push(ep);
      return acc;
    }, {});
  }, [filtered]);

  const formSchema = selected ? buildSchema(selected) : null;
  const form = useForm<Record<string, unknown>>({
    resolver: formSchema ? zodResolver(formSchema) : undefined,
    defaultValues: selected ? defaultsFromExample(selected) : {},
    mode: 'onBlur',
  });

  const hasOptional = selected?.params.some((p) => !p.required) ?? false;

  const onSubmit = form.handleSubmit((values) => {
    if (!selected) return;
    const payload = cleanPayload(values as Record<string, unknown>);
    const requestShape = {
      endpoint: selected.path,
      method: selected.method,
      ...(selected.method === 'GET' || selected.method === 'DELETE'
        ? { query: payload }
        : { body: payload }),
    };
    const yamlPayload = YAML.dump(requestShape, { skipInvalid: true });
    setYamlText(yamlPayload);
    setCopyState('idle');
  });

  const copyText = async (text: string) => {
    if (!text) return;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      setCopyState('copied');
      setTimeout(() => setCopyState('idle'), 1500);
    } catch (err) {
      setCopyState('error');
      setTimeout(() => setCopyState('idle'), 2000);
    }
  };

  const onSelect = (id: string) => {
    setSelectedId(id);
    const next = endpoints.find((e) => e.id === id);
    if (next) {
      const defaults = defaultsFromExample(next);
      form.reset(defaults);
      setYamlText('');
      setShowOptional(false);
    }
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar__search">
          <input
            type="search"
            placeholder="Search by name or path"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="topbar__select">
          <label htmlFor="endpoint-select">API Call</label>
          <select
            id="endpoint-select"
            value={selected?.id || ''}
            onChange={(e) => onSelect(e.target.value)}
          >
            {Object.entries(grouped).map(([sectionName, items]) => (
              <optgroup key={sectionName} label={sectionName}>
                {items.map((ep) => (
                  <option key={ep.id} value={ep.id}>
                    {ep.title}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>
      </header>
      <main className="main">
        {selected ? (
          <div className="endpoint">
            <header className="endpoint__header">
              <div>
                <div className="pill">{selected.method}</div>
                <h1>{selected.title}</h1>
                <p className="endpoint__path">{selected.path}</p>
              </div>
            </header>

            <section className="form-section">
              <h2>Parameters</h2>
              {hasOptional && (
                <div className="toggle-row">
                  <label className="toggle">
                    <input
                      type="checkbox"
                      checked={showOptional}
                      onChange={(e) => setShowOptional(e.target.checked)}
                      aria-label="Show optional fields"
                    />
                    Show optional fields
                  </label>
                </div>
              )}
              <form onSubmit={onSubmit} className="param-form">
                {selected.params.filter((p) => p.required).length === 0 && !showOptional && (
                  <p>This endpoint lists no required parameters. Toggle to view optional ones.</p>
                )}
                {selected.params
                  .filter((param) => param.required || showOptional)
                  .map((param) => (
                  <div key={param.name} className="form-field">
                    <label>
                      <span>{normalizeName(param.name)}</span>
                      <span className={`field-badge ${param.required ? 'required' : 'optional'}`}>
                        {param.required ? 'Required' : 'Optional'}
                      </span>
                    </label>
                    <small className="subtle">{hintFor(param, selected)}</small>
                    <input
                      {...form.register(normalizeName(param.name))}
                      placeholder={param.description}
                      required={param.required}
                      aria-required={param.required ? 'true' : 'false'}
                      aria-invalid={form.formState.errors[normalizeName(param.name)] ? 'true' : 'false'}
                    />
                    {form.formState.errors[normalizeName(param.name)] && (
                      <div className="error">This field is required or invalid.</div>
                    )}
                  </div>
                  ))}
                <div className="form-actions">
                  <button type="submit" className="primary">
                    Generate YAML
                  </button>
                  <button type="button" onClick={() => form.reset(defaultsFromExample(selected))}>
                    Reset to defaults
                  </button>
                </div>
              </form>
            </section>

              <section className="output-section">
                <div className="output-card">
                  <div className="output-header">
                    <h3>YAML Request Body</h3>
                    {yamlText && (
                      <button type="button" onClick={() => copyText(yamlText)}>
                        {copyState === 'copied' ? 'Copied' : copyState === 'error' ? 'Retry' : 'Copy YAML'}
                      </button>
                    )}
                  </div>
                  <pre>{yamlText || 'Fill the form and click Generate YAML'}</pre>
                </div>
              </section>
          </div>
        ) : (
          <p>Select an endpoint to begin.</p>
        )}
      </main>
    </div>
  );
}

function matchesSearch(endpoint: Endpoint, term: string) {
  const q = term.toLowerCase();
  return (
    endpoint.title.toLowerCase().includes(q) ||
    endpoint.path.toLowerCase().includes(q) ||
    endpoint.method.toLowerCase().includes(q)
  );
}

export default App;
