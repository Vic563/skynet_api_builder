import { z } from 'zod';
import type { Endpoint, Parameter } from '../types';

export const normalizeName = (name: string) =>
  name
    .replace(/\\_/g, '_')
    .replace(/[`]/g, '')
    .replace(/[<>]/g, '')
    .replace(/[:;,]$/g, '')
    .trim()
    .replace(/\s+/g, '_');

export function buildSchema(endpoint: Endpoint) {
  const shape: Record<string, z.ZodTypeAny> = {};
  endpoint.params.forEach((param) => {
    const base = z.any();
    const key = normalizeName(param.name);
    shape[key] = param.required ? base : base.optional();
  });
  return z.object(shape);
}

export function defaultsFromExample(endpoint: Endpoint) {
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

export function exampleFor(endpoint: Endpoint, paramName: string) {
  const key = normalizeName(paramName);
  const ex = endpoint.example as Record<string, unknown> | undefined;
  if (!ex) return undefined;
  if (Object.prototype.hasOwnProperty.call(ex, paramName)) return ex[paramName];
  if (Object.prototype.hasOwnProperty.call(ex, key)) return ex[key];
  return undefined;
}

export function hintFor(param: Parameter, endpoint: Endpoint) {
  const ex = exampleFor(endpoint, param.name);
  const name = normalizeName(param.name);
  if (name === 'sdn_version') {
    const base = 'Defaulting to 2 (SDN2). Use 1 only for legacy/SDN1 fabrics.';
    if (ex !== undefined) return `${base} Example: ${String(ex)}`;
    return base;
  }
  
  // Special handling for sync config endpoint - device_id and hostname are mutually exclusive
  if (endpoint.path === '/api/v4/sdn/arista/switch/sync_config') {
    if (name === 'device_id' || name === 'hostname') {
      const mutualExclusiveWarning = '⚠️ Cannot be used together with the other parameter. Only one can be specified.';
      if (ex !== undefined) {
        return `${mutualExclusiveWarning} Example: ${String(ex)}`;
      }
      const desc = param.description?.trim();
      if (desc) {
        return `${desc} ${mutualExclusiveWarning}`;
      }
      return mutualExclusiveWarning;
    }
  }
  
  if (ex !== undefined) return `Example: ${String(ex)}`;
  const desc = param.description?.trim();
  if (desc) return desc;
  return param.required ? 'Required' : 'Optional';
}

export function cleanPayload(payload: Record<string, unknown>) {
  const cleaned: Record<string, unknown> = {};
  Object.entries(payload).forEach(([key, value]) => {
    if (value === '' || value === undefined || value === null) return;
    cleaned[key] = value;
  });
  return cleaned;
}

export function matchesSearch(endpoint: Endpoint, term: string) {
  const q = term.toLowerCase();
  return (
    endpoint.title.toLowerCase().includes(q) ||
    endpoint.path.toLowerCase().includes(q) ||
    endpoint.method.toLowerCase().includes(q)
  );
}

/**
 * Fixes YAML output to ensure endpoint lines are on a single line.
 * Replaces folded endpoint lines (endpoint: >-\n  /path) with single-line format (endpoint: /path)
 */
export function fixEndpointYaml(yaml: string): string {
  const lines = yaml.split('\n');
  const fixed: string[] = [];
  let i = 0;
  
  while (i < lines.length) {
    const line = lines[i];
    
    // Check if this line starts an endpoint with folding indicator (>- or >)
    const endpointMatch = line.match(/^(\s*)endpoint:\s*[>|-]+\s*$/);
    
    if (endpointMatch) {
      const indent = endpointMatch[1];
      // Find the continuation line(s) and combine them
      let endpointValue = '';
      let j = i + 1;
      
      // Collect all indented continuation lines until we hit a non-indented line or another key
      while (j < lines.length) {
        const nextLine = lines[j];
        
        // Stop if empty line or if it's a new key at the same or less indentation
        if (!nextLine.trim()) {
          break;
        }
        
        // Check if it's another key-value pair (stops at same or less indentation)
        const nextIndentMatch = nextLine.match(/^(\s*)(\w+):/);
        if (nextIndentMatch && nextIndentMatch[1].length <= indent.length) {
          break;
        }
        
        // If line is indented more than the endpoint line, it's a continuation
        const indentMatch = nextLine.match(/^(\s*)/);
        const nextIndent = indentMatch ? indentMatch[1].length : 0;
        if (nextLine.match(/^\s/) && nextIndent > indent.length) {
          const continuation = nextLine.trim();
          // Skip if it's just the folding indicator itself
          if (continuation && !continuation.match(/^[>|-]+$/)) {
            endpointValue += continuation;
          }
          j++;
        } else {
          // Not indented enough, stop collecting
          break;
        }
      }
      
      // Output as single line
      if (endpointValue) {
        fixed.push(`${indent}endpoint: ${endpointValue}`);
      } else {
        fixed.push(line);
      }
      
      i = j;
    } else {
      fixed.push(line);
      i++;
    }
  }
  
  return fixed.join('\n');
}
