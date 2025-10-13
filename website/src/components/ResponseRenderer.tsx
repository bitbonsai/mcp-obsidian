import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';

// Catppuccin Mocha theme
const catppuccinMocha = {
  'code[class*="language-"]': {
    color: '#cdd6f4',
    background: 'none',
    fontFamily: 'Consolas, Monaco, "Andale Mono", "Ubuntu Mono", monospace',
    fontSize: '1em',
    textAlign: 'left',
    whiteSpace: 'pre',
    wordSpacing: 'normal',
    wordBreak: 'normal',
    wordWrap: 'normal',
    lineHeight: '1.5',
    tabSize: '4',
    hyphens: 'none',
  },
  'pre[class*="language-"]': {
    color: '#cdd6f4',
    background: '#1e1e2e77',
    fontFamily: 'Consolas, Monaco, "Andale Mono", "Ubuntu Mono", monospace',
    fontSize: '1em',
    textAlign: 'left',
    whiteSpace: 'pre',
    wordSpacing: 'normal',
    wordBreak: 'normal',
    wordWrap: 'normal',
    lineHeight: '1.5',
    tabSize: '4',
    hyphens: 'none',
    padding: '1em',
    margin: '.5em 0',
    overflow: 'auto',
    borderRadius: '0.3em',
  },
  'comment': { color: '#6c7086' },
  'prolog': { color: '#6c7086' },
  'doctype': { color: '#6c7086' },
  'cdata': { color: '#6c7086' },
  'punctuation': { color: '#cdd6f4' },
  'property': { color: '#89b4fa' },
  'tag': { color: '#89b4fa' },
  'boolean': { color: '#fab387' },
  'number': { color: '#fab387' },
  'constant': { color: '#fab387' },
  'symbol': { color: '#f5c2e7' },
  'deleted': { color: '#f38ba8' },
  'selector': { color: '#a6e3a1' },
  'attr-name': { color: '#f9e2af' },
  'string': { color: '#a6e3a1' },
  'char': { color: '#a6e3a1' },
  'builtin': { color: '#f5c2e7' },
  'inserted': { color: '#a6e3a1' },
  'operator': { color: '#94e2d5' },
  'entity': { color: '#f9e2af' },
  'url': { color: '#89b4fa' },
  'variable': { color: '#cdd6f4' },
  'atrule': { color: '#f9e2af' },
  'attr-value': { color: '#a6e3a1' },
  'function': { color: '#89b4fa' },
  'class-name': { color: '#f9e2af' },
  'keyword': { color: '#cba6f7' },
  'regex': { color: '#f5c2e7' },
  'important': { color: '#fab387', fontWeight: 'bold' },
  'bold': { fontWeight: 'bold' },
  'italic': { fontStyle: 'italic' },
};

interface ResponseRendererProps {
  response: string;
}

export default function ResponseRenderer({ response }: ResponseRendererProps) {
  const parts = response.split(/```json\n|```/);

  return (
    <div className="demo-response">
      {parts.map((part, index) => {
        if (index % 2 === 1) {
          // This is a JSON block
          return (
            <SyntaxHighlighter
              key={index}
              language="json"
              style={catppuccinMocha as any}
              customStyle={{
                margin: '0.5rem 0',
                borderRadius: '8px',
                fontSize: '0.875rem',
                background: '#1e1e2e77',
              }}
            >
              {part.trim()}
            </SyntaxHighlighter>
          );
        }
        // Regular text
        return (
          <pre
            key={index}
            className="text-foreground whitespace-pre-wrap font-mono text-sm leading-relaxed"
            style={{
              fontFamily: '"JetBrains Mono", "SF Mono", Monaco, "Cascadia Code", "Roboto Mono", Consolas, "Courier New", monospace'
            }}
          >
            {part}
          </pre>
        );
      })}
    </div>
  );
}
