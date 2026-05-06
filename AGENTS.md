# Case Builder Rules

Architecture:

- preload → ipc → usecase → repository
- No business logic in IPC

Electron:

- Never block main thread
- Use spawn instead of exec for heavy processes

File Handling:

- Store files in ~/.local/share/case-builder/
- Always persist metadata in DB

Code Style:

- Use async/await
- Keep functions small
- Avoid unnecessary dependencies
- Write specific and concise comments to describe functions
- Avoid writing long code larger than 250 lines in single file.
