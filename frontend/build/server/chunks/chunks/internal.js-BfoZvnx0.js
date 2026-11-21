// node_modules/.pnpm/@sveltejs+kit@2.69.2_@sveltejs+vite-plugin-svelte@7.2.0_svelte@5.56.8_@typescript-eslin_fe1b8803c1bddee9d0da6d0e9971d584/node_modules/@sveltejs/kit/src/runtime/app/paths/internal/server.js
var base = "";
var assets = base;
var app_dir = "_app";
var initial = {
	base,
	assets
};
/**
* @param {{ base: string, assets: string }} paths
*/
function override(paths) {
	base = paths.base;
	assets = paths.assets;
}
function reset() {
	base = initial.base;
	assets = initial.assets;
}

export { assets as a, base as b, app_dir as c, override as o, reset as r };
//# sourceMappingURL=internal.js-BfoZvnx0.js.map
