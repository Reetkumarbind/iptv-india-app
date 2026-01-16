# Figma Power Setup Guide

## Step 1: Get Your Figma Access Token

1. Go to [Figma Account Settings](https://www.figma.com/settings)
2. Scroll down to "Personal Access Tokens"
3. Click "Generate new token"
4. Give it a name (e.g., "Kiro MCP Integration")
5. Copy the token (you won't be able to see it again!)

## Step 2: Configure the MCP Server

1. Open `.kiro/settings/mcp.json`
2. Replace `YOUR_FIGMA_TOKEN_HERE` with your actual Figma token
3. Save the file

## Step 3: Install UV (if not already installed)

The Figma MCP server uses `uvx` to run. You need to install `uv` first:

**Using pip:**
```bash
pip install uv
```

**Using Homebrew (Mac/Linux):**
```bash
brew install uv
```

**Using PowerShell (Windows):**
```powershell
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```

Or visit: https://docs.astral.sh/uv/getting-started/installation/

## Step 4: Restart/Reconnect the MCP Server

1. Open the command palette (Ctrl+Shift+P / Cmd+Shift+P)
2. Search for "MCP"
3. Select "Reconnect MCP Servers" or restart Kiro

## Step 5: Verify Connection

Once configured, you can:
- Generate design system rules from your codebase
- Map React components to Figma designs
- Keep design and code in sync

## Next Steps

After setup is complete, tell me and I'll:
1. Generate your design system rules
2. Create the Figma Code Connect hook
3. Show you how to use it with your components
