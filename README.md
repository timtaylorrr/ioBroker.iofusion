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

Not supported yet: locks, fans, vacuum cleaners, cameras, alarm panels, todo lists, update entities, thermostat modes and schedules, blind tilt.

## Rooms and automatic dashboard
On the first start (while no dashboard exists) the adapter builds one from your ioBroker rooms (`enum.rooms`):
one view per room, grouped into lights & switches, blinds, climate, sensors and actions. Room members can be
states, channels or devices. A room name at the start of a device name is removed ("Wohnzimmer Licht" becomes "Licht").
Devices without a room go to a view "Other" if there are at most 40 of them, otherwise they are left out.
The button "Generate dashboard from rooms" in the instance settings rebuilds it; the old file is kept as
`dashboard.yaml.bak-<time>` in the data directory.

## Settings
Port (default 8095), bind address, a filter for the exposed state IDs (`hm-rpc.*, 0_userdata.0.*`), the history instance for graphs (`history.0`, `influxdb.0`, `sql.0`), login, blind inversion and how the generated dashboard is grouped.
Dashboard and settings are stored in the instance data directory, so they are part of the ioBroker backup.

## Login
Enable "Require login" in the instance settings and set a username and password (stored encrypted by ioBroker).
Without a username or password the adapter refuses to start the web server instead of running open.

- Sign in at `/login`, sign out at `/logout`. The session lasts 30 days (cookie, `HttpOnly`, `SameSite=Lax`, `Secure` behind an https proxy).
- Everything is behind the login: pages, the `/_api` endpoints and the WebSocket (cross-site WebSocket connections are refused).
- Five failed attempts from one address lock the login for a minute.
- Changing the password signs everybody out. The signing secret lives in `.session-secret` in the data directory.
- There is one user. The connection is not encrypted by itself: use a reverse proxy with https if you expose the port outside your home network.
- Login is off by default so existing instances keep working. The log warns while it is off.

## Development
```
npm install
npm run build:frontend   # needs Node >= 22.15 and pnpm 10
npm run dev              # fake ioBroker on http://127.0.0.1:8095 (DEV_AUTH=user:password enables the login)
npm test
```
`frontend/` is a copy of ha-fusion with small changes (configurable data dir, own-origin connection).

## Changelog

### 0.3.0
- Tap toggles a device, a long press opens its detail dialog (no more extra click)
- Entity picker: flat search with several words ("licht eg küche"), tree without search, merged single-child levels, opened groups scroll into view
- Fixed the settings dialog (it spun forever) and all other routes that looked for static files in the wrong folder; token, update check and Home Assistant log out are hidden in the adapter
- `homeassistant.toggle/turn_on/turn_off` are supported (switch dialog, scenes)
- The old default theme "godis" is replaced by "iofusion" once; the WebSocket token survives restarts
- Adapter log shows service calls (debug) and refused connections (warn)

### 0.2.0
- Rooms and automatic dashboard (`enum.rooms`, optional grouping by `enum.functions`)
- Login with cookie sessions
- Climate, blinds, media players, colour lights, indicator sensors
- History graphs through a history adapter (history, influxdb, sql)
- Notifications for low batteries and unreachable devices
- Live updates when states are added or removed
- New "iofusion" dark and light themes, logout button, admin translations (en, de)

### 0.1.0
- Initial version: ha-fusion frontend with a Home Assistant compatible bridge for ioBroker
