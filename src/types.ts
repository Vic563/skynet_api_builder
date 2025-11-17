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
