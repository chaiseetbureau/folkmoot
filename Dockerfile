# Folkmoot MCP bridge: a stdio MCP server forwarding to https://folkmoot.salukilabs.com/mcp (for directories that build and introspect stdio
# servers, such as Glama). No dependencies beyond Node.
FROM node:24-alpine
WORKDIR /app
COPY bridge/bridge.mjs ./bridge.mjs
USER node
ENTRYPOINT ["node", "/app/bridge.mjs"]
