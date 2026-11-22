# ioBroker.iofusion

Drag-and-drop dashboard for ioBroker, based on [ha-fusion](https://github.com/knowald/ha-fusion) (MIT).

The adapter serves the ha-fusion frontend and implements the part of the Home Assistant
WebSocket API the frontend needs (`/api/websocket`). ioBroker states are exposed as
Home Assistant style entities, so the frontend runs unchanged.

## Status: early prototype

| ioBroker role (type) | Entity |
|---|---|
| `switch*` (boolean, writable) | `switch.*` / `light.*` (role contains `light`) |
| `level.dimmer`, `level.brightness` (number, writable) | `light.*` with brightness |
| `value*`, `sensor*`, `level.*` (number) | `sensor.*` (unit, device class from role) |
| `sensor*` (boolean) | `binary_sensor.*` |
| `button*` (boolean, writable) | `button.*` |
| `level.temperature` (number, writable) | `climate.*` (setpoint; current temperature from a `value.temperature` state in the same channel) |
| `level.blind`, `level.curtain`, `level.shutter` (number, writable) | `cover.*` (position, open/close/toggle; stop works if a `*stop*` button is in the same channel) |

Blind position: 100 is open. If your blinds use 100 for closed, enable "Invert blind position" in the instance settings.
Thermostats expose one mode (`heat`) and a target temperature; modes, presets and schedules are not mapped yet.

Not supported yet: media players, history/statistics graphs, areas (enum.rooms), todo, updates.

## Settings
Port (default 8095), bind address and a filter for the exposed state IDs (`hm-rpc.*, 0_userdata.0.*`).
Dashboard and settings are stored in the instance data directory, so they are part of the ioBroker backup.

**Security:** there is no login yet. Anyone who can reach the port can switch every exposed state.
Bind to a trusted network or put it behind a reverse proxy with authentication.

## Development
```
npm install
npm run build:frontend   # needs Node >= 22.15 and pnpm 10
npm run dev              # fake ioBroker on http://127.0.0.1:8095
npm test
```
`frontend/` is a copy of ha-fusion with small changes (configurable data dir, own-origin connection).
