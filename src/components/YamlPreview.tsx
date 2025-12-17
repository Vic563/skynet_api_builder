interface YamlPreviewProps {
    yamlText: string;
    copyText: (text: string) => void;
    copyState: 'idle' | 'copied' | 'error';
}

export function YamlPreview({ yamlText, copyText, copyState }: YamlPreviewProps) {
    return (
        <div className="yaml-preview">
            <div className="preview-header">
                <h3>Request Body</h3>
                {yamlText && (
                    <button
                        type="button"
                        className={`btn-copy ${copyState}`}
                        onClick={() => copyText(yamlText)}
                    >
                        {copyState === 'copied' ? 'Copied!' : copyState === 'error' ? 'Error' : 'Copy YAML'}
                    </button>
                )}
            </div>
            <div className="preview-content">
                <pre>
                    <code>{yamlText || '# Fill the form to generate YAML...'}</code>
                </pre>
            </div>
        </div>
    );
}
