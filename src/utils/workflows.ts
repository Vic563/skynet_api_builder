import YAML from 'js-yaml';
import specFile from '../data/skynetSpec.json';
import type { Endpoint, SpecFile, Workflow, WorkflowSnippet } from '../types';
import { normalizeName, fixEndpointYaml } from './helpers';

const spec = specFile as SpecFile;
const manualWorkflowInputs: Record<string, string[]> = {
  'vip-migration': [
    'vip_name',
    'f5',
    'lbpair',
    'source_lb_pair',
    'destination_lb_pair',
    'action',
    'backout_on_fail',
    'activated',
  ],
};

const manualInputHints: Record<string, string> = {
  vip_name: 'Full VIP fqdn + port, e.g. example.ssnc-corp.cloud-443',
  f5: 'Hostname of an F5 device, e.g. wcdlb7-cloud.ssnc-corp.cloud',
  lbpair: 'Include lbpair to return the current F5 pair for the VIP',
  source_lb_pair: 'Two-element list of source F5 hostnames',
  destination_lb_pair: 'Two-element list of destination F5 hostnames',
  action:
    'copy|copy_disable|move|delete_source|delete_destination|enable_source|enable_destination|disable_source|disable_destination',
  backout_on_fail: 'true to auto-backout if migrate fails (default true)',
  activated: 'true to leave VIPs enabled after migrate (default true)',
  wip: 'Work-in-progress host name for GSLB, e.g. app.ssnc-corp.cloud',
  task_id: 'Optional GSLB task id to fetch status',
  fqdn: 'Fully-qualified domain name, e.g. rundeck.ssnc-corp.cloud',
  port: 'Listener port (number), e.g. 443',
  type: 'Service type, e.g. enterprise',
  protocol: 'Protocol string, e.g. http/https/tcp',
  site: 'Site code (short name), e.g. wcd',
  tenant: 'Tenant name or code',
  ZONE_NAME: 'Security zone name',
  TENANT_NAME: 'Tenant name for the zone',
  tags: 'Comma-delimited tag map (bu, tier, prod_nonprod, etc.)',
  endpoints: 'Array of endpoints to add/remove (name + ip)',
};

function basePath(path: string): string {
  return path.split('?')[0];
}

function findEndpointForStep(path: string, method: string): Endpoint | undefined {
  const targetBase = basePath(path);
  return spec.endpoints.find((ep) => {
    const epBase = basePath(ep.path);
    return epBase === targetBase && ep.method === method;
  });
}

function bodyFromEndpointExample(endpoint: Endpoint): Record<string, unknown> {
  if (endpoint.example && typeof endpoint.example === 'object' && !Array.isArray(endpoint.example)) {
    return endpoint.example as Record<string, unknown>;
  }
  return {};
}

export type WorkflowInputs = Record<string, string>;

export function defaultWorkflowInputs(): WorkflowInputs {
  return {
    topology_name: 'tst',
    device_name: 'tstlf169-cloud',
    device_layer: 'leaf_baremetal',
    device_model: '7050sx3',
    device_pod: 'p01',
    device_cabinet: 'T5',
    device_service_cabinet: 'T5',
    device_management_cabinet: 'T5',
    device_console_cabinet: '',
    device_mac: '00:1b:77:49:54:fd',
    site: 'tst',
    device_type: 'lf',
    fabric: 'cloud',
    pod: 'p01',
    device_id: '',
    sync_hostname: '',
  };
}

export function buildWorkflowSnippets(
  workflow: Workflow,
  inputs: Record<string, string>,
): WorkflowSnippet[] {
  return workflow.steps.map((step) => {
    let body: Record<string, unknown> = {};

    const pathWithInputs = applyInputsToPath(step.path, inputs);

    if (step.path === '/api/v4/sdn/arista/switch/adhoc_register') {
      // Required fields must always be present
      body = {
        topology_name: inputs.topology_name,
        device_name: inputs.device_name,
        device_layer: inputs.device_layer,
        device_model: inputs.device_model,
        device_pod: inputs.device_pod,
        device_cabinet: inputs.device_cabinet,
      };

      // Optional fields only included when non-empty
      if (inputs.device_service_cabinet) {
        body.device_service_cabinet = inputs.device_service_cabinet;
      }
      if (inputs.device_management_cabinet) {
        body.device_management_cabinet = inputs.device_management_cabinet;
      }
      if (inputs.device_console_cabinet) {
        body.device_console_cabinet = inputs.device_console_cabinet;
      }
    } else if (step.path === '/api/v4/sdn/arista/switch/lockout') {
      body = {
        hostname: inputs.device_name,
        lockout: 'soft_lockout',
      };
    } else if (step.path === '/api/v4/sdn/arista/switch/adhoc_onboard') {
      body = {
        device_name: inputs.device_name,
        device_mac: inputs.device_mac,
      };
    } else if (step.path === '/api/v4/sdn/arista/switch/sync_config') {
      body = {
        site: inputs.site,
      };
      // Optional sync filters only included when non-empty
      if (inputs.device_type) {
        body.device_type = inputs.device_type;
      }
      if (inputs.fabric) {
        body.fabric = inputs.fabric;
      }
      if (inputs.pod) {
        body.pod = inputs.pod;
      }
      // device_id and hostname are mutually exclusive - cannot be used together
      if (inputs.device_id && inputs.sync_hostname) {
        // If both are provided, prioritize device_id and exclude hostname
        // This prevents API errors from conflicting filters
        body.device_id = inputs.device_id;
      } else if (inputs.device_id) {
        body.device_id = inputs.device_id;
      } else if (inputs.sync_hostname) {
        body.hostname = inputs.sync_hostname;
      }
    } else {
      const endpoint = findEndpointForStep(step.path, step.method);
      if (endpoint) {
        const exampleBody = replacePlaceholdersInObject(bodyFromEndpointExample(endpoint), inputs);
        const paramKeys = endpoint.params.map((p) => p.name);
        const userProvided: Record<string, unknown> = {};
        paramKeys.forEach((key) => {
          const val = inputs[key] ?? inputs[normalizeName(key)];
          if (val !== undefined && val !== '') {
            userProvided[key] = val;
          }
        });

        if (Object.keys(userProvided).length) {
          body = { ...exampleBody, ...userProvided };
        } else if (Object.keys(exampleBody).length) {
          body = exampleBody;
        }
      }
    }

    const requestShape: WorkflowSnippet['request'] = {
      endpoint: pathWithInputs,
      method: step.method,
    };

    if (step.method === 'GET' || step.method === 'DELETE') {
      if (Object.keys(body).length) {
        requestShape.query = body;
      }
    } else if (Object.keys(body).length) {
      requestShape.body = body;
    }

    const yamlRaw = YAML.dump(requestShape, { 
      skipInvalid: true,
      lineWidth: -1, // Prevent line folding
      noRefs: true,
    });
    const yaml = fixEndpointYaml(yamlRaw);
    const json = JSON.stringify(requestShape, null, 2);

    return {
      stepId: step.id,
      stepLabel: step.label,
      yaml,
      json,
      request: requestShape,
    };
  });
}

function replacePlaceholders(input: string, values: Record<string, string>): string {
  let output = input;
  Object.entries(values).forEach(([key, val]) => {
    if (!val) return;
    const tokenVariants = [
      `<${key}>`,
      `<${key.toLowerCase()}>`,
      `<${key.toUpperCase()}>`,
      key,
      key.toLowerCase(),
      key.toUpperCase(),
    ];
    tokenVariants.forEach((tok) => {
      output = output.split(tok).join(val);
    });
  });
  return output;
}

function replacePlaceholdersInObject(
  obj: Record<string, unknown>,
  values: Record<string, string>,
): Record<string, unknown> {
  const next: Record<string, unknown> = {};
  Object.entries(obj).forEach(([k, v]) => {
    if (typeof v === 'string') {
      next[k] = replacePlaceholders(v, values);
    } else if (v && typeof v === 'object' && !Array.isArray(v)) {
      next[k] = replacePlaceholdersInObject(v as Record<string, unknown>, values);
    } else {
      next[k] = v;
    }
  });
  return next;
}

function applyInputsToPath(path: string, values: Record<string, string>): string {
  const [rawBase, rawQuery] = path.split('?');
  const base = replacePlaceholders(rawBase, values);

  if (!rawQuery) return base;

  const queryParts = rawQuery.split('&').filter(Boolean);
  const updated = queryParts.map((pair) => {
    const [k, ...rest] = pair.split('=');
    const v = rest.join('=');
    const userVal = values[k] ?? values[normalizeName(k)];
    const finalVal = userVal !== undefined && userVal !== '' ? userVal : replacePlaceholders(v, values);
    return `${k}=${finalVal}`;
  });

  return `${base}?${updated.join('&')}`;
}

export function extractWorkflowInputs(workflow: Workflow): string[] {
  const tokens = new Set<string>();
  workflow.steps.forEach((step) => {
    const angled = step.path.match(/<([^>]+)>/g) || [];
    angled.forEach((tok) => tokens.add(tok.replace(/[<>]/g, '')));
    const upper = step.path.match(/\b[A-Z][A-Z0-9_]{2,}\b/g) || [];
    upper.forEach((tok) => tokens.add(tok));

    const [, query] = step.path.split('?');
    if (query) {
      query.split('&').forEach((pair) => {
        const [k, v] = pair.split('=');
        if (k) tokens.add(k);
        const angledVal = v?.match(/<([^>]+)>/g) || [];
        angledVal.forEach((tok) => tokens.add(tok.replace(/[<>]/g, '')));
      });
    }

    const endpoint = findEndpointForStep(step.path, step.method);
    if (endpoint) {
      endpoint.params.forEach((p) => tokens.add(p.name));
      Object.keys(bodyFromEndpointExample(endpoint)).forEach((k) => tokens.add(k));
    }
  });

  if (manualWorkflowInputs[workflow.id]) {
    manualWorkflowInputs[workflow.id].forEach((name) => tokens.add(name));
  }

  return Array.from(tokens);
}

export function getWorkflowInputHint(workflow: Workflow, field: string): string {
  const manual = manualInputHints[field] ?? manualInputHints[normalizeName(field)];
  if (manual) return manual;

  const lowerField = normalizeName(field);
  
  // Check if workflow contains sync config step
  const hasSyncConfigStep = workflow.steps.some(
    (step) => step.path === '/api/v4/sdn/arista/switch/sync_config'
  );
  
  // Special handling for sync config endpoint - device_id and sync_hostname are mutually exclusive
  if (hasSyncConfigStep && (lowerField === 'device_id' || lowerField === 'sync_hostname')) {
    const mutualExclusiveWarning = '⚠️ Cannot be used together with the other parameter. Only one can be specified.';
    const baseHint = manual || '';
    return baseHint ? `${baseHint} ${mutualExclusiveWarning}` : mutualExclusiveWarning;
  }

  for (const step of workflow.steps) {
    const endpoint = findEndpointForStep(step.path, step.method);
    if (!endpoint) continue;
    const param = endpoint.params.find(
      (p) => normalizeName(p.name) === lowerField || p.name === field,
    );
    if (param && param.description) return param.description;

    const example = bodyFromEndpointExample(endpoint);
    if (Object.prototype.hasOwnProperty.call(example, field)) {
      const val = example[field];
      if (val !== undefined && val !== null) return `Example: ${String(val)}`;
    }
    if (Object.prototype.hasOwnProperty.call(example, lowerField)) {
      const val = example[lowerField];
      if (val !== undefined && val !== null) return `Example: ${String(val)}`;
    }
  }

  return '';
}
