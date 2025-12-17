import { describe, it, expect } from 'vitest';
import { normalizeName, cleanPayload, matchesSearch, fixEndpointYaml } from './helpers';
import type { Endpoint } from '../types';

describe('normalizeName', () => {
    it('normalizes names correctly', () => {
        expect(normalizeName('foo_bar')).toBe('foo_bar');
        expect(normalizeName('foo bar')).toBe('foo_bar');
        expect(normalizeName('foo\\_bar')).toBe('foo_bar');
        expect(normalizeName('`foo`')).toBe('foo');
        expect(normalizeName('<foo>')).toBe('foo');
        expect(normalizeName('foo:')).toBe('foo');
    });
});

describe('cleanPayload', () => {
    it('removes empty, undefined, and null values', () => {
        const input = {
            a: 'value',
            b: '',
            c: undefined,
            d: null,
            e: 0,
            f: false,
        };
        const output = cleanPayload(input);
        expect(output).toEqual({
            a: 'value',
            e: 0,
            f: false,
        });
    });
});

describe('matchesSearch', () => {
    const endpoint: Endpoint = {
        id: 'get-users',
        title: 'Get Users',
        section: 'Users',
        method: 'GET',
        path: '/api/v1/users',
        params: [],
        example: null,
    };

    it('matches by title', () => {
        expect(matchesSearch(endpoint, 'Users')).toBe(true);
        expect(matchesSearch(endpoint, 'get')).toBe(true);
    });

    it('matches by path', () => {
        expect(matchesSearch(endpoint, '/api/v1')).toBe(true);
    });

    it('matches by method', () => {
        expect(matchesSearch(endpoint, 'GET')).toBe(true);
    });

    it('is case insensitive', () => {
        expect(matchesSearch(endpoint, 'users')).toBe(true);
    });

    it('returns false for no match', () => {
        expect(matchesSearch(endpoint, 'posts')).toBe(false);
    });
});

describe('fixEndpointYaml', () => {
    it('fixes folded endpoint lines', () => {
        const yaml = `endpoint: >-
  /api/v4/cloud/loadbalancer_mgmt?fqdn=rundeck.ssnc-corp.cloud&port=443&type=ente
method: GET
query:
  site: tst`;

        const fixed = fixEndpointYaml(yaml);
        expect(fixed).toContain('endpoint: /api/v4/cloud/loadbalancer_mgmt?fqdn=rundeck.ssnc-corp.cloud&port=443&type=ente');
        expect(fixed).not.toContain('endpoint: >-');
    });

    it('handles multi-line folded endpoints', () => {
        const yaml = `endpoint: >-
  /api/v4/c
  loud/loadbalancer_mgmt
method: POST`;

        const fixed = fixEndpointYaml(yaml);
        expect(fixed).toContain('endpoint: /api/v4/cloud/loadbalancer_mgmt');
        expect(fixed).not.toContain('endpoint: >-');
    });

    it('preserves other YAML content', () => {
        const yaml = `endpoint: >-
  /api/v4/test
method: GET
query:
  site: tst`;

        const fixed = fixEndpointYaml(yaml);
        expect(fixed).toContain('method: GET');
        expect(fixed).toContain('query:');
        expect(fixed).toContain('site: tst');
    });

    it('handles already single-line endpoints', () => {
        const yaml = `endpoint: /api/v4/test
method: GET`;

        const fixed = fixEndpointYaml(yaml);
        expect(fixed).toBe(yaml);
    });
});
