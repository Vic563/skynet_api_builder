import { useState, useCallback, useRef, useEffect } from 'react';

type CopyState = 'idle' | 'copied' | 'error';

// Cached textarea element shared across all hook instances
let cachedTextarea: HTMLTextAreaElement | null = null;

function getOrCreateTextarea(): HTMLTextAreaElement {
  if (!cachedTextarea) {
    cachedTextarea = document.createElement('textarea');
    cachedTextarea.style.position = 'fixed';
    cachedTextarea.style.opacity = '0';
    cachedTextarea.style.pointerEvents = 'none';
    cachedTextarea.style.left = '-9999px';
    cachedTextarea.setAttribute('aria-hidden', 'true');
    cachedTextarea.setAttribute('tabindex', '-1');
  }
  return cachedTextarea;
}

/**
 * Hook for copying text to clipboard with optimized fallback.
 * Uses a cached textarea element for the execCommand fallback.
 */
export function useCopyToClipboard() {
  const [copyState, setCopyState] = useState<CopyState>('idle');
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const copyText = useCallback(async (text: string) => {
    if (!text) return;

    // Clear any pending state reset
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        // Use cached textarea for fallback
        const textarea = getOrCreateTextarea();
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopyState('copied');
      timeoutRef.current = setTimeout(() => setCopyState('idle'), 1500);
    } catch {
      setCopyState('error');
      timeoutRef.current = setTimeout(() => setCopyState('idle'), 2000);
    }
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return { copyState, copyText };
}

/**
 * Hook for copying text to clipboard with multiple keys (for workflow steps).
 */
export function useMultiCopyToClipboard() {
  const [copyStates, setCopyStates] = useState<Record<string, CopyState>>({});
  const timeoutRefs = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const copyText = useCallback(async (key: string, text: string) => {
    if (!text) return;

    // Clear any pending state reset for this key
    if (timeoutRefs.current[key]) {
      clearTimeout(timeoutRefs.current[key]);
    }

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const textarea = getOrCreateTextarea();
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopyStates((prev) => ({ ...prev, [key]: 'copied' }));
      timeoutRefs.current[key] = setTimeout(() => {
        setCopyStates((prev) => ({ ...prev, [key]: 'idle' }));
      }, 1500);
    } catch {
      setCopyStates((prev) => ({ ...prev, [key]: 'error' }));
      timeoutRefs.current[key] = setTimeout(() => {
        setCopyStates((prev) => ({ ...prev, [key]: 'idle' }));
      }, 2000);
    }
  }, []);

  // Cleanup all timeouts on unmount
  useEffect(() => {
    return () => {
      Object.values(timeoutRefs.current).forEach(clearTimeout);
    };
  }, []);

  const getCopyState = useCallback(
    (key: string): CopyState => copyStates[key] || 'idle',
    [copyStates],
  );

  return { getCopyState, copyText };
}
