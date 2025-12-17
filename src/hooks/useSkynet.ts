import { useState, useMemo, useEffect, useCallback } from 'react';
import YAML from 'js-yaml';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import specFile from '../data/skynetSpec.json';
import type { Endpoint, SpecFile } from '../types';
import {
    buildSchema,
    defaultsFromExample,
    cleanPayload,
    matchesSearch,
    fixEndpointYaml,
} from '../utils/helpers';
import { useDebounce } from './useDebounce';
import { useCopyToClipboard } from './useCopyToClipboard';

const spec = specFile as SpecFile;

export function useSkynet() {
    // Memoize endpoints once
    const endpoints = useMemo(() => spec.endpoints, []);

    // Search state with debouncing
    const [query, setQuery] = useState('');
    const debouncedQuery = useDebounce(query, 150);

    const [selectedId, setSelectedId] = useState(() => (endpoints.length ? endpoints[0].id : ''));
    const [yamlText, setYamlText] = useState('');
    const [showOptional, setShowOptional] = useState(false);

    // Use optimized clipboard hook
    const { copyState, copyText } = useCopyToClipboard();

    // Memoize filtered endpoints using debounced query
    const filtered = useMemo(
        () => endpoints.filter((ep) => !debouncedQuery || matchesSearch(ep, debouncedQuery)),
        [endpoints, debouncedQuery],
    );

    // Update selected if current selection is not in filtered results
    useEffect(() => {
        if (!filtered.length) return;
        if (!filtered.some((ep) => ep.id === selectedId)) {
            setSelectedId(filtered[0].id);
        }
    }, [filtered, selectedId]);

    // Memoize selected endpoint
    const selected = useMemo(
        () => filtered.find((e) => e.id === selectedId) || filtered[0],
        [filtered, selectedId],
    );

    // Memoize grouped endpoints
    const grouped = useMemo(() => {
        return filtered.reduce<Record<string, Endpoint[]>>((acc, ep) => {
            acc[ep.section] = acc[ep.section] || [];
            acc[ep.section].push(ep);
            return acc;
        }, {});
    }, [filtered]);

    // Memoize form schema
    const formSchema = useMemo(
        () => (selected ? buildSchema(selected) : null),
        [selected],
    );

    const form = useForm<Record<string, unknown>>({
        resolver: formSchema ? zodResolver(formSchema) : undefined,
        defaultValues: selected ? defaultsFromExample(selected) : {},
        mode: 'onBlur',
    });

    // Reset form when selected endpoint changes
    useEffect(() => {
        if (selected) {
            const defaults = defaultsFromExample(selected);
            form.reset(defaults);
            setYamlText('');
            setShowOptional(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selected?.id, form]);

    // Memoize the generateYaml function
    const generateYaml = useCallback(
        (values: Record<string, unknown>) => {
            if (!selected) return '';

            let payload = cleanPayload(values);

            // For sync config endpoint, ensure device_id and hostname are mutually exclusive
            if (selected.path === '/api/v4/sdn/arista/switch/sync_config') {
                const deviceId = payload.device_id;
                const hostname = payload.hostname;

                // If both are provided, prioritize device_id and remove hostname
                if (deviceId && hostname) {
                    delete payload.hostname;
                }
            }

            const requestShape = {
                endpoint: selected.path,
                method: selected.method,
                ...(selected.method === 'GET' || selected.method === 'DELETE'
                    ? { query: payload }
                    : { body: payload }),
            };

            const yamlRaw = YAML.dump(requestShape, {
                skipInvalid: true,
                lineWidth: -1,
                noRefs: true,
            });

            return fixEndpointYaml(yamlRaw);
        },
        [selected],
    );

    const onSubmit = form.handleSubmit((values) => {
        const yaml = generateYaml(values as Record<string, unknown>);
        setYamlText(yaml);
    });

    return {
        query,
        setQuery,
        selectedId,
        setSelectedId,
        selected,
        grouped,
        form,
        onSubmit,
        yamlText,
        showOptional,
        setShowOptional,
        copyState,
        copyText,
        endpoints,
        filtered,
    };
}
