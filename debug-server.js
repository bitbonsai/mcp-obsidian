#!/usr/bin/env node

console.error("Debug: Starting minimal MCP server");
console.error("Debug: Node version:", process.version);
console.error("Debug: Process argv:", process.argv);
console.error("Debug: Process env PATH:", process.env.PATH);
console.error("Debug: Process env BUN_INSTALL:", process.env.BUN_INSTALL);

// Simple minimal server that just exits after logging
setTimeout(() => {
    console.error("Debug: Exiting after 2 seconds");
    process.exit(0);
}, 2000);