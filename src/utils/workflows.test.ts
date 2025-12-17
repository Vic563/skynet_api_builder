import { describe, it, expect } from 'vitest';
import { extractWorkflowInputs } from './workflows';
import { workflows } from '../data/workflows';

describe('extractWorkflowInputs', () => {
  it('finds query params for GSLB WIP lifecycle', () => {
    const wf = workflows.find((w) => w.id === 'gslb-wip-lifecycle');
    expect(wf).toBeTruthy();
    const fields = extractWorkflowInputs(wf!);
    expect(fields).toContain('wip');
    expect(fields).toContain('task_id');
  });

  it('finds query params for load balancer VIP lifecycle', () => {
    const wf = workflows.find((w) => w.id === 'load-balancer-vip-lifecycle');
    expect(wf).toBeTruthy();
    const fields = extractWorkflowInputs(wf!);
    expect(fields).toEqual(
      expect.arrayContaining(['fqdn', 'port', 'type', 'protocol', 'site']),
    );
  });
});
