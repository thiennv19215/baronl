# @orbitstage/runtime

Runtime/domain layer shared by the Electron shell and tests.

This package owns application configuration contracts and the live session runtime. It must not import Electron APIs. Platform-specific storage, windows, secrets, IPC, AI/TTS adapters and HTTP serving remain in `apps/desktop`.
