import { dirname } from "node:path";
import type { VaultAppProvider } from "./vault-app-provider.js";
import type { FrontmatterHandler } from "./frontmatter.js";
import type { FileSystemService } from "./filesystem.js";

interface ToolResponse {
  content: Array<{ type: "text"; text: string }>;
  isError?: boolean;
  [key: string]: unknown;
}

export async function handleActiveFile(
  vaultApp: VaultAppProvider,
  frontmatterHandler: FrontmatterHandler,
  args: {
    include_content?: boolean;
    parse_frontmatter?: boolean;
    frontmatter_only?: boolean;
    prettyPrint?: boolean;
  },
): Promise<ToolResponse> {
  await vaultApp.ensureRunning();

  if (args.parse_frontmatter && args.frontmatter_only) {
    throw new Error(
      "Cannot specify both parse_frontmatter and frontmatter_only — use one or the other",
    );
  }

  const info = await vaultApp.getActiveFileInfo();
  const indent = args.prettyPrint ? 2 : undefined;

  // Default include_content to true; frontmatter_only still reads content to parse it
  const wantContent = args.frontmatter_only ? true : (args.include_content ?? true);

  let content: string | undefined;
  if (wantContent) {
    content = await vaultApp.readActiveFileContent();
  }

  const response: Record<string, unknown> = { ...info };

  if (args.frontmatter_only && content != null) {
    const parsed = frontmatterHandler.parse(content);
    response.fm = parsed.frontmatter;
    // No content field — that's the point of frontmatter_only
  } else if (args.parse_frontmatter && content != null) {
    const parsed = frontmatterHandler.parse(content);
    response.fm = parsed.frontmatter;
    response.content = parsed.content;
  } else if (content != null) {
    response.content = content;
  }

  return {
    content: [{ type: "text", text: JSON.stringify(response, null, indent) }],
  };
}

export async function handleActiveFolder(
  vaultApp: VaultAppProvider,
  fileSystem: FileSystemService,
  args: {
    include_files?: boolean;
    prettyPrint?: boolean;
  },
): Promise<ToolResponse> {
  await vaultApp.ensureRunning();

  const info = await vaultApp.getActiveFileInfo();
  const filePath = info.path as string;
  const indent = args.prettyPrint ? 2 : undefined;

  // dirname returns "." for root-level files — correct vault-relative behavior
  const folder = dirname(filePath);

  const response: Record<string, unknown> = {
    dir: folder,
    active: filePath,
  };

  if (args.include_files ?? true) {
    const listing = await fileSystem.listDirectory(folder);
    response.files = listing.files;
  }

  return {
    content: [{ type: "text", text: JSON.stringify(response, null, indent) }],
  };
}

export async function handleOpen(
  vaultApp: VaultAppProvider,
  args: {
    path: string;
    newtab?: boolean;
    prettyPrint?: boolean;
  },
): Promise<ToolResponse> {
  await vaultApp.ensureRunning();

  const path = args.path;
  if (!path || path.trim() === "") {
    throw new Error("path is required");
  }

  const newtab = args.newtab ?? true;
  await vaultApp.openFile(path, { newtab });

  const indent = args.prettyPrint ? 2 : undefined;
  return {
    content: [{ type: "text", text: JSON.stringify({ opened: path, newtab }, null, indent) }],
  };
}
