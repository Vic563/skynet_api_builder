export interface Parameter {
  name: string;
  description: string;
  required: boolean;
}

export interface Endpoint {
  id: string;
  title: string;
  section: string;
  method: string;
  path: string;
  params: Parameter[];
  example: Record<string, unknown> | string | null;
}

export interface SpecFile {
  generatedAt: string;
  endpoints: Endpoint[];
}

export interface WorkflowStep {
  id: string;
  label: string;
  description?: string;
  method: string;
  path: string;
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  steps: WorkflowStep[];
}

export interface WorkflowSnippetRequest {
  endpoint: string;
  method: string;
  query?: Record<string, unknown>;
  body?: Record<string, unknown>;
}

export interface WorkflowSnippet {
  stepId: string;
  stepLabel: string;
  yaml: string;
  json: string;
  request: WorkflowSnippetRequest;
}
