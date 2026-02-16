import { useState } from 'react';
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

interface DemoExample {
  id: string;
  title: string;
  icon: string;
  claude: string;
  response: string;
  details: string[];
}

const examples: DemoExample[] = [
  {
    id: 'patch',
    title: 'Efficient Editing',
    icon: '✏️',
    claude: 'Add the equation for energy-mass equivalence to my physics notes',
    response: `🔧 MCP-Obsidian: Using patch_note...

Request:
\`\`\`json
{
  "path": "Physics/Relativity.md",
  "oldString": "## Energy and Mass",
  "newString": "## Energy and Mass\\n\\nE = mc²"
}
\`\`\`

Response:
\`\`\`json
{
  "success": true,
  "path": "Physics/Relativity.md",
  "message": "Successfully replaced 1 occurrence",
  "matchCount": 1
}
\`\`\`

✅ Done! Added Einstein's equation to your notes.
Only the specific section was updated - no full file rewrite needed.`,
    details: [
      'MCP server used patch_note for efficient partial update',
      'Multi-line text replacement performed atomically',
      'Frontmatter and formatting preserved perfectly',
      '10x faster than rewriting entire file',
      'replaceAll defaults to false — fails safely if multiple matches found'
    ]
  },
  {
    id: 'write',
    title: 'Create Notes',
    icon: '📝',
    claude: 'Create a quick note about today\'s meeting',
    response: `🔧 MCP-Obsidian: Using write_note...

Request:
\`\`\`json
{
  "path": "Meetings/Team Sync.md",
  "content": "# Team Sync\\n\\n- Discussed Q1 goals\\n- Action items assigned"
}
\`\`\`

Response:
Successfully wrote note: Meetings/Team Sync.md (mode: overwrite)

✅ Done! I've created your meeting note.`,
    details: [
      'MCP server wrote the complete note to disk',
      'AI generated the structured content',
      'File created atomically with proper formatting',
      'Ready to open and edit in Obsidian',
      'Supports overwrite, append, and prepend modes'
    ]
  },
  {
    id: 'read_multiple',
    title: 'Read Multiple Notes',
    icon: '📚',
    claude: 'Read all my book club notes and give me a summary',
    response: `🔧 MCP-Obsidian: Using read_multiple_notes...

Request:
\`\`\`json
{
  "paths": [
    "Reading/The Phoenix Project.md",
    "Reading/Atomic Habits.md",
    "Reading/Deep Work.md"
  ],
  "prettyPrint": true
}
\`\`\`

Response:
\`\`\`json
{
  "ok": [
    {
      "path": "Reading/The Phoenix Project.md",
      "content": "...",
      "frontmatter": {...}
    }
  ],
  "err": []
}
\`\`\`

✅ I've read all 3 notes. Here's a summary:
Common themes across these books: systems thinking, habit formation, and focus. All emphasize the importance of intentional work practices and continuous improvement.`,
    details: [
      'MCP server read multiple files in one request (max 10)',
      'Returns ok (successful) and err (failed) arrays',
      'AI analyzes across multiple documents',
      'More efficient than reading files one-by-one',
      'prettyPrint defaults to false for minimal token usage'
    ]
  },
  {
    id: 'frontmatter',
    title: 'Manage Frontmatter',
    icon: '🏷️',
    claude: 'Update the status and add tags to my project planning note',
    response: `🔧 MCP-Obsidian: Using update_frontmatter...

Request:
\`\`\`json
{
  "path": "Projects/Website Redesign.md",
  "frontmatter": {
    "tags": [
      "project",
      "web-design",
      "priority-high"
    ],
    "status": "in-progress",
    "created": "2025-01-15",
    "updated": "2025-01-20"
  }
}
\`\`\`

Response:
Successfully updated frontmatter for: Projects/Website Redesign.md

✅ Done! I've updated the frontmatter with the new status and tags.`,
    details: [
      'MCP server safely updated YAML frontmatter',
      'Merges with existing frontmatter by default (merge: true)',
      'Updates are performed atomically',
      'Note content remains untouched',
      'YAML is validated before writing to prevent corruption'
    ]
  },
  {
    id: 'search',
    title: 'Search Content',
    icon: '🔍',
    claude: 'Search for "React hooks" in my notes',
    response: `🔧 MCP-Obsidian: Using search_notes...

Request:
\`\`\`json
{
  "query": "React hooks",
  "limit": 10,
  "prettyPrint": true
}
\`\`\`

Response:
\`\`\`json
[
  {
    "p": "Development/React Best Practices.md",
    "t": "React Best Practices",
    "ex": "...State **React hooks** provide...",
    "mc": 8,
    "ln": 42
  },
  {
    "p": "Learning/Modern JavaScript.md",
    "t": "Modern JavaScript",
    "ex": "...useEffect are common **React hooks**...",
    "mc": 3,
    "ln": 156
  }
]
\`\`\`

✅ Found 2 notes with 11 total matches across your vault.`,
    details: [
      'MCP server performed full-text search across vault',
      'Token-optimized response: p=path, t=title, ex=excerpt, mc=matchCount, ln=lineNumber',
      'Returns 21-char context excerpts around matches',
      'AI can then read specific files for more details',
      'prettyPrint defaults to false for minimal token usage'
    ]
  }
];

export default function InteractiveDemo() {
  const [activeTab, setActiveTab] = useState(examples[0].id);
  const [isTyping, setIsTyping] = useState(false);

  const activeExample = examples.find(ex => ex.id === activeTab) || examples[0];

  const handleTabClick = (id: string) => {
    if (id !== activeTab) {
      setIsTyping(true);
      setActiveTab(id);
      setTimeout(() => setIsTyping(false), 1000);
    }
  };

  return (
    <section className="relative py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-background to-card/20">
      <div className="max-w-6xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-16 fade-in-on-scroll">
          <h2 className="text-4xl sm:text-5xl font-bold gradient-text mb-6">
            See It In Action
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Watch how AI assistants intelligently interact with your Obsidian vault.
            These examples show real conversations and outcomes.
          </p>
        </div>

        {/* Tab navigation */}
        <div className="flex flex-wrap justify-center gap-2 mb-8 fade-in-on-scroll">
          {examples.map((example) => (
            <button
              key={example.id}
              onClick={() => handleTabClick(example.id)}
              aria-label={`Show ${example.title} demo`}
              className={`
                inline-flex items-center gap-2 px-4 py-3 rounded-xl font-medium transition-all duration-300
                ${activeTab === example.id
                  ? 'bg-accent text-white shadow-lg shadow-accent/25'
                  : 'bg-card/50 text-muted-foreground hover:text-foreground hover:bg-card border border-border/50'
                }
              `}
            >
              <span className="text-lg">{example.icon}</span>
              <span className="hidden sm:inline">{example.title}</span>
            </button>
          ))}
        </div>

        {/* Demo content */}
        <div className="fade-in-on-scroll">
          <div className="bg-card/30 backdrop-blur-xl rounded-2xl border border-border/50 overflow-hidden shadow-2xl">
            {/* Chat header */}
            <div className="bg-card/50 border-b border-border/50 p-4">
              <div className="flex items-center gap-3">
                <div className="flex gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                </div>
                <span className="font-mono text-sm text-muted-foreground">
                  AI Desktop Tool - MCP-Obsidian Active
                </span>
                <div className="ml-auto flex items-center gap-2">
                  <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
                  <span className="text-sm text-success font-medium">Connected</span>
                </div>
              </div>
            </div>

            {/* Chat content */}
            <div className="p-6 space-y-6">
              {/* User message */}
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-background font-bold text-sm">
                  You
                </div>
                <div className="flex-1">
                  <div className="bg-background/50 rounded-2xl rounded-tl-none p-4 border border-border/30">
                    <p className="text-foreground">{activeExample.claude}</p>
                  </div>
                </div>
              </div>

              {/* Claude response */}
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-accent-2 flex items-center justify-center text-background font-bold text-sm">
                  AI
                </div>
                <div className="flex-1">
                  <div className="bg-card/20 rounded-2xl rounded-tl-none p-4 border border-border/30 relative">
                    {isTyping ? (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <div className="flex gap-1">
                          <div className="w-2 h-2 bg-accent-2 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-accent-2 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-accent-2 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                        <span>AI is thinking...</span>
                      </div>
                    ) : (
                      <div className="demo-response">
                        {activeExample.response.split(/```json\n|```/).map((part, index) => {
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
                            <pre key={index} className="text-foreground whitespace-pre-wrap font-mono text-sm leading-relaxed" style={{
                              fontFamily: '"JetBrains Mono", "SF Mono", Monaco, "Cascadia Code", "Roboto Mono", Consolas, "Courier New", monospace'
                            }}>
                              {part}
                            </pre>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Technical details */}
            {!isTyping && (
              <div className="bg-background/30 border-t border-border/50 p-6">
                <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <svg className="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Technical Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {activeExample.details.map((detail, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <svg className="w-3 h-3 text-success flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span>{detail}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Call to action */}
        <div className="text-center mt-12 fade-in-on-scroll">
          <p className="text-muted-foreground mb-6">
            Ready to experience this level of AI-powered note management?
          </p>
          <a
            href="/install"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-accent hover:bg-accent/90 text-white font-semibold text-lg transition-all duration-300 hover:shadow-[0_0_20px_rgba(139,92,246,0.6)] hover:-translate-y-1 hover:scale-105"
          >
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Get Started Now
          </a>
        </div>
      </div>
    </section>
  );
}