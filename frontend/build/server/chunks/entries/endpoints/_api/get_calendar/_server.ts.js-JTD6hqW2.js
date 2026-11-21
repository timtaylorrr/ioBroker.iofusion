import { j as json, e as error } from '../../../../chunks/exports.js-Bd3l1EgL.js';
import '../../../../chunks/utils.js-D2UuUCQ3.js';

// src/routes/_api/get_calendar/+server.ts
var POST = async ({ request }) => {
	try {
		const { url, token } = await request.json();
		const response = await fetch(url, {
			method: "GET",
			headers: {
				Authorization: `Bearer ${token}`,
				"Content-Type": "application/json"
			}
		});
		const data = await response.json();
		if (response.ok) return json(data);
	} catch (err) {
		error(500, err.message);
	}
};

export { POST };
//# sourceMappingURL=_server.ts.js-JTD6hqW2.js.map
