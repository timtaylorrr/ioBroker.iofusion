import { a1 as store_get, a2 as attr_style, a3 as stringify, X as ensure_array_like, a6 as attr, a9 as attr_class, a4 as unsubscribe_stores, N as derived, $ as escape_html, a5 as html, Y as await_block, U as writable, a0 as store_set, Z as spread_props, aa as get } from './server2.js-3CCBNf-F.js';
import { u as itemHeight, j as editMode, m as motion, w as states, o as lang, x as getName, z as isDisplayOnlyDomain, A as templates, p as getDomain, B as timer } from './Stores.js-Ds1UPH-g.js';
import { o as onDestroy } from './index-server2.js-dcuzgjTu.js';
import './sortable.js-Cx-MuqM8.js';
import { I as Icon, l as loadIcon } from './Icon.js-WGuGVXqb.js';
import { S as StateLogic } from './StateLogic.js-DQoyzIi2.js';
import './marked.esm.js-CegTtKpz.js';
import './Modals.js-BY7D36NX.js';
import './js-yaml.js-BMpLS0W5.js';
import './routing.js-DHi-aafC.js';
import './server.js-DiHwXqKh.js';
import './internal2.js-KHoVCR_I.js';
import { L as Loader } from './Loader.js-CBitMnHG.js';
import './rolldown-runtime.js-DkXggAHL.js';
import 'node:module';
import './events.js-B96EXmHB.js';

// src/lib/Components/ComputeIcon.svelte
function ComputeIcon($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { entity_id, getIconString = void 0, skipEntityPicture = void 0, size = void 0, oniconString = void 0 } = $$props;
		$$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]-->`);
	});
}
// src/lib/Main/Button.svelte
function Button($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		var $$store_subs;
		let { demo = void 0, sel, sectionName = void 0, displayOnly = false } = $$props;
		let entity_id = derived(() => demo || sel?.entity_id);
		let template = derived(() => store_get($$store_subs ??= {}, "$templates", templates)?.[sel?.id]);
		let icon = derived(() => sel?.template?.icon && template()?.icon?.output || sel?.icon);
		let color = derived(() => sel?.template?.color && template()?.color?.output || sel?.color);
		let marquee = derived(() => sel?.marquee);
		let entity = void 0;
		let contentWidth = 0;
		let stateOn = false;
		let isSliding = false;
		let isDisplayOnly = derived(() => displayOnly === true || (sel?.displayOnly ?? isDisplayOnlyDomain(entity_id())));
		let isLightWithBrightness = derived(() => getDomain(entity_id()) === "light" && false);
		/**
		* Observes changes in the `last_updated` property of an entity.
		* When the `last_updated` property changes:
		*
		* - Updates `entity` with the new state from `$states`
		* - Resets the `loading` state to `false`
		* - Clears any pending loading or reset timeouts
		*/
		let attributes = derived(() => void 0);
		let iconColor = derived(() => color() ? color() : attributes()?.hs_color ? `hsl(${attributes()?.hs_color}%, 50%)` : "rgb(75, 166, 237)");
		let image = derived(() => icon()?.includes("."));
		onDestroy(() => {
		});
		$$renderer.push(`<div class="container svelte-4ux4m1"${attr("data-state", stateOn)}${attr("data-display-only", isDisplayOnly())} tabindex="-1"${attr_style(!store_get($$store_subs ??= {}, "$editMode", editMode) && !isDisplayOnly() ? "cursor: pointer;" : isDisplayOnly() ? "cursor: default;" : "", { "min-height": `${stringify(store_get($$store_subs ??= {}, "$itemHeight", itemHeight))}px` })}><div class="left svelte-4ux4m1" role="button"${attr("tabindex", isDisplayOnly() ? -1 : 0)}><div${attr_class("icon svelte-4ux4m1", void 0, { "image": image() })}${attr("data-state", stateOn)}${attr("data-display-only", isDisplayOnly())}${attr_style("", {
			"--icon-color": iconColor(),
			"background-color": !isDisplayOnly() && sel?.template?.color && template()?.color?.output ? template()?.color?.output : void 0,
			"background-image": !icon() && attributes()?.entity_picture ? `url(${attributes()?.entity_picture})` : image() && icon() ? `url(${icon()})` : "none"
		})}>`);
		if (image() || !icon() && attributes()?.entity_picture) {
			$$renderer.push("<!--[1-->");
			$$renderer.push(` `);
		} else if (icon()) {
			$$renderer.push("<!--[2-->");
			await_block($$renderer, loadIcon(icon()), () => {
				Icon($$renderer, {
					icon: "ooui:help-ltr",
					height: "none",
					width: "100%"
				});
			}, (resolvedIcon) => {
				Icon($$renderer, {
					icon: resolvedIcon,
					height: "none",
					width: "100%"
				});
			});
			$$renderer.push(`<!--]-->`);
		} else if (entity_id()) {
			$$renderer.push("<!--[3-->");
			ComputeIcon($$renderer, { entity_id: entity_id() });
		} else {
			$$renderer.push("<!--[-1-->");
			Icon($$renderer, {
				icon: "ooui:help-ltr",
				height: "none",
				width: "100%"
			});
		}
		$$renderer.push(`<!--]--></div></div> <div${attr_class("right svelte-4ux4m1", void 0, { "sliding": isSliding })} role="button"${attr("tabindex", isDisplayOnly() ? -1 : 0)}${attr("aria-pressed", stateOn)}><div class="name svelte-4ux4m1"${attr("data-state", stateOn)}${attr("data-display-only", isDisplayOnly())}>${html(sel?.template?.name && template()?.name?.output || getName(sel, entity, sectionName) || store_get($$store_subs ??= {}, "$lang", lang)("unknown"))}</div>  <div class="state svelte-4ux4m1"${attr("data-state", stateOn)}${attr("data-display-only", isDisplayOnly())}>`);
		if (marquee()) {
			$$renderer.push("<!--[0-->");
			$$renderer.push(`<div style="width: min-content;">`);
			if (sel?.state || sel?.template?.state && template()?.state?.output) {
				$$renderer.push("<!--[0-->");
				$$renderer.push(`${html(sel?.state || template()?.state?.output)}`);
			} else if (sel?.template?.set_state && template()?.set_state?.output) {
				$$renderer.push("<!--[1-->");
				$$renderer.push(`${html(sel?.template?.set_state && store_get($$store_subs ??= {}, "$lang", lang)(template()?.set_state?.output))}`);
			} else {
				$$renderer.push("<!--[-1-->");
				StateLogic($$renderer, {
					entity_id: entity_id(),
					selected: sel,
					contentWidth
				});
			}
			$$renderer.push(`<!--]--></div>`);
		} else {
			$$renderer.push("<!--[-1-->");
			$$renderer.push(`<div style="overflow: hidden; text-overflow: ellipsis;">`);
			if (sel?.state || sel?.template?.state && template()?.state?.output) {
				$$renderer.push("<!--[0-->");
				$$renderer.push(`${html(sel?.state || template()?.state?.output)}`);
			} else if (sel?.template?.set_state && template()?.set_state?.output) {
				$$renderer.push("<!--[1-->");
				$$renderer.push(`${html(sel?.template?.set_state && store_get($$store_subs ??= {}, "$lang", lang)(template()?.set_state?.output))}`);
			} else {
				$$renderer.push("<!--[-1-->");
				StateLogic($$renderer, {
					entity_id: entity_id(),
					selected: sel,
					contentWidth
				});
			}
			$$renderer.push(`<!--]--></div>`);
		}
		$$renderer.push(`<!--]--></div></div> `);
		if (isLightWithBrightness() && false);
		else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--></div>`);
		if ($$store_subs) unsubscribe_stores($$store_subs);
	});
}
// src/lib/Main/ConditionalMedia.svelte
function ConditionalMedia($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		var $$store_subs;
		let { sel, demo = void 0 } = $$props;
		let contentWidth = 0;
		let backgroundImage = void 0;
		let pauseExpired = false;
		let remaining = void 0;
		let entity = derived(() => store_get($$store_subs ??= {}, "$states", states)?.[demo || sel?.entity_id]);
		let entity_data = derived(() => entity()?.attributes?.data?.[1]);
		let timeout = derived(() => sel?.timeout ?? 900);
		let current_media_player = derived(() => getCurrent(sel?.media_players, store_get($$store_subs ??= {}, "$states", states), pauseExpired, timeout()));
		let currentEntityId = derived(() => current_media_player()?.entity_id);
		let currentState = derived(() => current_media_player()?.state);
		let currentAttr = derived(() => current_media_player()?.attributes);
		let media_artist = derived(() => currentAttr()?.media_artist);
		let media_title = derived(() => currentAttr()?.media_title);
		let active = derived(() => currentState() === "playing" || currentState() === "paused" && true);
		function getCurrent(media_players, states, pauseExpired, timeout) {
			if (!media_players) return void 0;
			const list = media_players?.map(({ entity_id }) => states?.[entity_id])?.filter((entity) => entity)?.sort((a, b) => new Date(b?.last_changed).getTime() - new Date(a?.last_changed).getTime());
			if (list?.length === 0) return void 0;
			const last_changed = list?.[0];
			if (timeout === 0) return list?.find((entity) => entity?.state === "playing");
			if (last_changed?.state === "playing") return last_changed;
			if (last_changed?.state === "paused") {
				if (currentState() === "playing") return list?.find((entity) => entity?.entity_id === currentEntityId());
				return last_changed;
			}
			return list?.find((entity) => entity?.state === "playing");
		}
		$$renderer.push(`<div data-exclude-drag-modal="" tabindex="0" role="button" class="container svelte-a6vujt"${attr_style("", {
			"background-image": backgroundImage,
			height: `calc(${stringify(store_get($$store_subs ??= {}, "$itemHeight", itemHeight))}px * 4 + 0.4rem * 3)`,
			cursor: store_get($$store_subs ??= {}, "$editMode", editMode) || !active() ? "unset" : "pointer"
		})}><div class="overlay-icon svelte-a6vujt">`);
		$$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--></div> `);
		if (sel?.show_timeout && !store_get($$store_subs ??= {}, "$editMode", editMode) && remaining);
		else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--> <div class="background svelte-a6vujt"${attr_style("", {
			"background-color": "none",
			"backdrop-filter": "none",
			"-webkit-backdrop-filter": "none"
		})}><div class="left svelte-a6vujt"><div class="icon svelte-a6vujt">`);
		if (active()) {
			$$renderer.push("<!--[0-->");
			if (currentAttr()?.icon) {
				$$renderer.push("<!--[0-->");
				Icon($$renderer, {
					icon: currentAttr()?.icon,
					height: "auto",
					width: "100%"
				});
			} else if (current_media_player()) {
				$$renderer.push("<!--[1-->");
				ComputeIcon($$renderer, {
					entity_id: current_media_player()?.entity_id,
					skipEntityPicture: true
				});
			} else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]-->`);
		} else if (sel?.icon || entity()?.attributes?.icon) {
			$$renderer.push("<!--[1-->");
			Icon($$renderer, {
				icon: sel?.icon || entity()?.attributes?.icon,
				height: "auto",
				width: "100%"
			});
		} else if (sel?.entity_id) {
			$$renderer.push("<!--[2-->");
			ComputeIcon($$renderer, {
				entity_id: sel?.entity_id,
				skipEntityPicture: true
			});
		} else {
			$$renderer.push("<!--[-1-->");
			Icon($$renderer, {
				icon: "ooui:help-ltr",
				height: "auto",
				width: "100%"
			});
		}
		$$renderer.push(`<!--]--></div></div> <div class="right svelte-a6vujt">`);
		if (active()) {
			$$renderer.push("<!--[0-->");
			$$renderer.push(`<div class="name svelte-a6vujt">${escape_html(getName(void 0, current_media_player()))}</div> <div class="state svelte-a6vujt"><div class="measure svelte-a6vujt">`);
			if (media_artist() && media_title()) {
				$$renderer.push("<!--[0-->");
				$$renderer.push(`${escape_html(media_artist())} - ${escape_html(media_title())}`);
			} else if (media_artist() && !media_title()) {
				$$renderer.push("<!--[1-->");
				$$renderer.push(`${escape_html(media_artist())}`);
			} else if (!media_artist() && media_title()) {
				$$renderer.push("<!--[2-->");
				$$renderer.push(`${escape_html(media_title())}`);
			} else {
				$$renderer.push("<!--[-1-->");
				StateLogic($$renderer, {
					entity_id: current_media_player()?.entity_id,
					selected: void 0
				});
			}
			$$renderer.push(`<!--]--></div> <div style="overflow: hidden; text-overflow: ellipsis;">`);
			if (sel?.marquee === true && contentWidth);
			else {
				$$renderer.push("<!--[-1-->");
				if (media_artist() && media_title()) {
					$$renderer.push("<!--[0-->");
					$$renderer.push(`${escape_html(media_artist())} - ${escape_html(media_title())}`);
				} else if (media_artist() && !media_title()) {
					$$renderer.push("<!--[1-->");
					$$renderer.push(`${escape_html(media_artist())}`);
				} else if (!media_artist() && media_title()) {
					$$renderer.push("<!--[2-->");
					$$renderer.push(`${escape_html(media_title())}`);
				} else {
					$$renderer.push("<!--[-1-->");
					StateLogic($$renderer, {
						entity_id: current_media_player()?.entity_id,
						selected: void 0
					});
				}
				$$renderer.push(`<!--]-->`);
			}
			$$renderer.push(`<!--]--></div></div>`);
		} else {
			$$renderer.push("<!--[-1-->");
			$$renderer.push(`<div class="name svelte-a6vujt">${escape_html(sel?.name || getName(void 0, entity()) || store_get($$store_subs ??= {}, "$lang", lang)("nothing_playing"))}</div> <div class="state svelte-a6vujt"><div class="measure svelte-a6vujt">`);
			if (entity_data()?.title) {
				$$renderer.push("<!--[0-->");
				$$renderer.push(`${escape_html(entity_data()?.title)} `);
				if (entity_data()?.aired) {
					$$renderer.push("<!--[0-->");
					$$renderer.push(`(${escape_html(entity_data()?.aired?.split("-")?.[0])})`);
				} else $$renderer.push("<!--[-1-->");
				$$renderer.push(`<!--]-->`);
			} else {
				$$renderer.push("<!--[-1-->");
				StateLogic($$renderer, {
					entity_id: sel?.entity_id,
					selected: sel
				});
			}
			$$renderer.push(`<!--]--></div> <div style="overflow: hidden; text-overflow: ellipsis;">`);
			if (sel?.marquee === true && contentWidth);
			else {
				$$renderer.push("<!--[-1-->");
				if (entity_data()?.title) {
					$$renderer.push("<!--[0-->");
					$$renderer.push(`${escape_html(entity_data()?.title)} `);
					if (entity_data()?.aired) {
						$$renderer.push("<!--[0-->");
						$$renderer.push(`(${escape_html(entity_data()?.aired?.split("-")?.[0])})`);
					} else $$renderer.push("<!--[-1-->");
					$$renderer.push(`<!--]-->`);
				} else {
					$$renderer.push("<!--[-1-->");
					StateLogic($$renderer, {
						entity_id: sel?.entity_id,
						selected: sel
					});
				}
				$$renderer.push(`<!--]-->`);
			}
			$$renderer.push(`<!--]--></div></div>`);
		}
		$$renderer.push(`<!--]--></div></div></div>`);
		if ($$store_subs) unsubscribe_stores($$store_subs);
	});
}
// src/lib/Main/PictureElements.svelte
function PictureElements($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		var $$store_subs;
		let { sel } = $$props;
		/**
		* Konva cleanup on destroy
		*/
		onDestroy(() => {});
		$$renderer.push(`<div class="svelte-1j3vx22"${attr_style("", {
			cursor: store_get($$store_subs ??= {}, "$editMode", editMode) ? "unset" : "default",
			height: `calc(${stringify(store_get($$store_subs ??= {}, "$itemHeight", itemHeight))}px * 4 + 0.4rem * 3)`,
			"background-color": !sel?.elements?.length ? "var(--theme-button-background-color-off)" : "transparent"
		})}></div>`);
		if ($$store_subs) unsubscribe_stores($$store_subs);
	});
}
// src/lib/Main/Camera.svelte
function Camera($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		var $$store_subs;
		let { sel, demo = void 0, responsive, muted, controls, allowEditStream = false } = $$props;
		const debug = false;
		let loaderVisible = true;
		let stream_url = void 0;
		let attachVideo = false;
		let entity = derived(() => demo && store_get($$store_subs ??= {}, "$states", states)?.[demo] || (sel?.entity_id ? store_get($$store_subs ??= {}, "$states", states)?.[sel?.entity_id] : void 0));
		let frontend_stream_type = derived(() => entity()?.attributes?.frontend_stream_type);
		let effective_stream_type = derived(() => frontend_stream_type() || (sel?.stream ? "hls" : void 0));
		let size = derived(() => sel?.size === "contain" ? "contain" : "cover");
		let cameraProps = derived(() => ({
			entity: entity(),
			sel,
			size: size(),
			responsive,
			muted,
			effective_stream_type: effective_stream_type(),
			allowEditStream
		}));
		/**
		* tame reactivity
		*/
		const entity_id = writable(sel?.entity_id);
		writable(sel?.stream);
		entity_id.subscribe((value) => {
			store_set(entity_id, value);
			attachVideo = false;
		});
		let $$settled = true;
		let $$inner_renderer;
		function $$render_inner($$renderer) {
			$$renderer.push(`<button class="svelte-w6sf8s"${attr_style("", {
				"background-size": size(),
				cursor: store_get($$store_subs ??= {}, "$editMode", editMode) || responsive ? "unset" : "pointer",
				height: responsive ? "100%" : `calc(${store_get($$store_subs ??= {}, "$itemHeight", itemHeight)}px * 4 + 0.4rem * 3)`,
				width: responsive ? "100%" : "calc(14.5rem * 2 + 0.4rem)"
			})}>`);
			if (loaderVisible && !store_get($$store_subs ??= {}, "$editMode", editMode)) {
				$$renderer.push("<!--[0-->");
				$$renderer.push(`<div class="loader svelte-w6sf8s"><div class="svelte-w6sf8s">`);
				Loader($$renderer);
				$$renderer.push(`<!----></div></div>`);
			} else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--> `);
			if (effective_stream_type() === "hls") {
				$$renderer.push("<!--[0-->");
				await_block($$renderer, import('./HLS.js-CL7Cn3h_.js'), () => {}, (HLS) => {
					if (HLS.default) {
						$$renderer.push("<!--[-->");
						HLS.default($$renderer, spread_props([cameraProps(), {
							attachVideo,
							controls,
							debug,
							get stream_url() {
								return stream_url;
							},
							set stream_url($$value) {
								stream_url = $$value;
								$$settled = false;
							},
							get loaderVisible() {
								return loaderVisible;
							},
							set loaderVisible($$value) {
								loaderVisible = $$value;
								$$settled = false;
							}
						}]));
						$$renderer.push("<!--]-->");
					} else {
						$$renderer.push("<!--[!-->");
						$$renderer.push("<!--]-->");
					}
				});
				$$renderer.push(`<!--]-->`);
			} else if (effective_stream_type() === "web_rtc") {
				$$renderer.push("<!--[1-->");
				await_block($$renderer, import('./WebRTC.js-B9_8ajy0.js'), () => {}, (WebRTC) => {
					if (WebRTC.default) {
						$$renderer.push("<!--[-->");
						WebRTC.default($$renderer, spread_props([cameraProps(), {
							attachVideo,
							controls,
							debug,
							get stream_url() {
								return stream_url;
							},
							set stream_url($$value) {
								stream_url = $$value;
								$$settled = false;
							},
							get loaderVisible() {
								return loaderVisible;
							},
							set loaderVisible($$value) {
								loaderVisible = $$value;
								$$settled = false;
							}
						}]));
						$$renderer.push("<!--]-->");
					} else {
						$$renderer.push("<!--[!-->");
						$$renderer.push("<!--]-->");
					}
				});
				$$renderer.push(`<!--]-->`);
			} else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--> `);
			await_block($$renderer, import('./Proxy.js-HlxikEvG.js'), () => {}, (Proxy) => {
				if (Proxy.default) {
					$$renderer.push("<!--[-->");
					Proxy.default($$renderer, spread_props([cameraProps(), {
						stream_url,
						get loaderVisible() {
							return loaderVisible;
						},
						set loaderVisible($$value) {
							loaderVisible = $$value;
							$$settled = false;
						}
					}]));
					$$renderer.push("<!--]-->");
				} else {
					$$renderer.push("<!--[!-->");
					$$renderer.push("<!--]-->");
				}
			});
			$$renderer.push(`<!--]--> `);
			if (muted && !responsive && sel?.hide_overlay !== true) {
				$$renderer.push("<!--[0-->");
				await_block($$renderer, import('./Info.js-BAKjbkJU.js'), () => {}, (Info) => {
					if (Info.default) {
						$$renderer.push("<!--[-->");
						Info.default($$renderer, {
							sel,
							entity: entity()
						});
						$$renderer.push("<!--]-->");
					} else {
						$$renderer.push("<!--[!-->");
						$$renderer.push("<!--]-->");
					}
				});
				$$renderer.push(`<!--]-->`);
			} else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--></button>`);
		}
		do {
			$$settled = true;
			$$inner_renderer = $$renderer.copy();
			$$render_inner($$inner_renderer);
		} while (!$$settled);
		$$renderer.subsume($$inner_renderer);
		if ($$store_subs) unsubscribe_stores($$store_subs);
	});
}
// src/lib/Main/Configure.svelte
function Configure($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		var $$store_subs;
		let { sel } = $$props;
		onDestroy(() => {
		});
		$$renderer.push(`<div role="button" tabindex="0" class="svelte-who3mt"${attr_style("", {
			"min-height": `${stringify(store_get($$store_subs ??= {}, "$itemHeight", itemHeight))}px`,
			cursor: store_get($$store_subs ??= {}, "$editMode", editMode) ? "unset" : "pointer"
		})}></div>`);
		if ($$store_subs) unsubscribe_stores($$store_subs);
	});
}
// src/lib/Main/Empty.svelte
function Empty($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		var $$store_subs;
		$$renderer.push(`<div class="container svelte-1q8s9bk" role="button" tabindex="0"${attr_style("", {
			height: `${stringify(store_get($$store_subs ??= {}, "$itemHeight", itemHeight))}px`,
			opacity: store_get($$store_subs ??= {}, "$editMode", editMode) ? "1" : "0",
			transition: `opacity ${stringify(store_get($$store_subs ??= {}, "$motion", motion))}ms ease`
		})}></div>`);
		if ($$store_subs) unsubscribe_stores($$store_subs);
	});
}
// src/lib/Main/DaysSince.svelte
function DaysSince($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		var $$store_subs;
		let { sel} = $$props;
		let icon = derived(() => sel?.icon || "mdi:calendar-clock");
		let name = derived(() => sel?.name || "Days Since");
		let color = derived(() => sel?.color || "rgb(75, 166, 237)");
		let entity_id = derived(() => sel?.entity_id);
		let entityState = derived(() => entity_id() ? store_get($$store_subs ??= {}, "$states", states)?.[entity_id()] : void 0);
		let last_reset = derived(() => entityState()?.state);
		let daysSince = derived(() => calculateDaysSince(last_reset(), store_get($$store_subs ??= {}, "$timer", timer)));
		function calculateDaysSince(lastReset, currentTime) {
			if (!lastReset) return 0;
			const resetDate = new Date(lastReset);
			const diffTime = Math.abs(currentTime.getTime() - resetDate.getTime());
			return Math.floor(diffTime / 864e5);
		}
		let image = derived(() => icon()?.includes("."));
		$$renderer.push(`<div class="container svelte-uysgzq" tabindex="-1" role="button"${attr_style("", {
			cursor: !store_get($$store_subs ??= {}, "$editMode", editMode) ? "pointer" : "",
			"min-height": `${stringify(store_get($$store_subs ??= {}, "$itemHeight", itemHeight))}px`
		})}><div class="left svelte-uysgzq"><div${attr_class("icon svelte-uysgzq", void 0, { "image": image() })}${attr_style("", {
			"--icon-color": color(),
			"background-color": color(),
			"background-image": image() && icon() ? `url(${icon()})` : "none"
		})}>`);
		if (image()) {
			$$renderer.push("<!--[0-->");
			$$renderer.push(` `);
		} else if (icon()) {
			$$renderer.push("<!--[1-->");
			await_block($$renderer, loadIcon(icon()), () => {
				Icon($$renderer, {
					icon: "mdi:calendar-clock",
					height: "none",
					width: "100%"
				});
			}, (resolvedIcon) => {
				Icon($$renderer, {
					icon: resolvedIcon,
					height: "none",
					width: "100%"
				});
			});
			$$renderer.push(`<!--]-->`);
		} else {
			$$renderer.push("<!--[-1-->");
			Icon($$renderer, {
				icon: "mdi:calendar-clock",
				height: "none",
				width: "100%"
			});
		}
		$$renderer.push(`<!--]--></div></div> <div class="right svelte-uysgzq"><div class="name svelte-uysgzq">${escape_html(name())}</div> <div class="state svelte-uysgzq">`);
		if (daysSince() === 0) {
			$$renderer.push("<!--[0-->");
			$$renderer.push(`${escape_html(store_get($$store_subs ??= {}, "$lang", lang)("today") || "Today")}`);
		} else if (daysSince() === 1) {
			$$renderer.push("<!--[1-->");
			$$renderer.push(`1 ${escape_html(store_get($$store_subs ??= {}, "$lang", lang)("day") || "day")}`);
		} else {
			$$renderer.push("<!--[-1-->");
			$$renderer.push(`${escape_html(daysSince())} ${escape_html(store_get($$store_subs ??= {}, "$lang", lang)("days") || "days")}`);
		}
		$$renderer.push(`<!--]--></div></div></div>`);
		if ($$store_subs) unsubscribe_stores($$store_subs);
	});
}
// src/lib/Main/Entities.svelte
function Entities($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		var $$store_subs;
		let { sel, demo = void 0 } = $$props;
		let entityIds = derived(() => {
			const explicit = sel?.entities?.filter(Boolean) ?? [];
			let matched = [];
			if (sel?.wildcard) {
				const pattern = sel.wildcard.split("*").map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join(".*");
				const regex = new RegExp(`^${pattern}$`);
				matched = Object.keys(store_get($$store_subs ??= {}, "$states", states)).filter((id) => regex.test(id)).sort();
			}
			const combined = [...explicit, ...matched.filter((id) => !explicit.includes(id))];
			return combined.length === 0 && demo ? [demo] : combined;
		});
		$$renderer.push(`<div class="container svelte-1pklh4g" tabindex="-1" role="button"${attr_style("", {
			height: `calc(${stringify(store_get($$store_subs ??= {}, "$itemHeight", itemHeight))}px * 4 + 0.4rem * 3)`,
			cursor: store_get($$store_subs ??= {}, "$editMode", editMode) ? "pointer" : "default"
		})}>`);
		if (sel?.name) {
			$$renderer.push("<!--[0-->");
			$$renderer.push(`<div class="header svelte-1pklh4g">${escape_html(sel.name)}</div>`);
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--> <div class="rows svelte-1pklh4g"><!--[-->`);
		const each_array = ensure_array_like(entityIds());
		for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
			let entity_id = each_array[$$index];
			const entity = store_get($$store_subs ??= {}, "$states", states)?.[entity_id];
			$$renderer.push(`<div class="row svelte-1pklh4g"><div class="icon svelte-1pklh4g">`);
			ComputeIcon($$renderer, {
				entity_id,
				size: "1.3rem"
			});
			$$renderer.push(`<!----></div> <div class="name svelte-1pklh4g">${escape_html(getName(void 0, entity) || entity_id)}</div> <div class="state svelte-1pklh4g">`);
			if (entity) {
				$$renderer.push("<!--[0-->");
				StateLogic($$renderer, {
					entity_id,
					selected: sel
				});
			} else {
				$$renderer.push("<!--[-1-->");
				$$renderer.push(`${escape_html(store_get($$store_subs ??= {}, "$lang", lang)("unknown"))}`);
			}
			$$renderer.push(`<!--]--></div></div>`);
		}
		$$renderer.push(`<!--]--> `);
		if (!entityIds().length) {
			$$renderer.push("<!--[0-->");
			$$renderer.push(`<div class="empty svelte-1pklh4g">${escape_html(store_get($$store_subs ??= {}, "$lang", lang)("entities"))}</div>`);
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--></div></div>`);
		if ($$store_subs) unsubscribe_stores($$store_subs);
	});
}
// src/lib/Main/SpotifyShortcuts.svelte
function SpotifyShortcuts($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { shortcuts = [], entity_id, default_device = void 0, layout = "compact" } = $$props;
		if (shortcuts.length > 0) {
			$$renderer.push("<!--[0-->");
			$$renderer.push(`<div${attr_class("shortcuts svelte-1w3wmc2", void 0, { "large": layout === "large" })}><!--[-->`);
			const each_array = ensure_array_like(shortcuts);
			for (let i = 0, $$length = each_array.length; i < $$length; i++) {
				let shortcut = each_array[i];
				$$renderer.push(`<button class="shortcut svelte-1w3wmc2"${attr("title", shortcut.name)}>`);
				if (shortcut.image_url) {
					$$renderer.push("<!--[0-->");
					$$renderer.push(`<img${attr("src", shortcut.image_url)}${attr("alt", shortcut.name)} class="shortcut-image svelte-1w3wmc2"/>`);
				} else {
					$$renderer.push("<!--[-1-->");
					$$renderer.push(`<div class="shortcut-placeholder svelte-1w3wmc2">`);
					Icon($$renderer, {
						icon: "mdi:play-circle-outline",
						height: "1.2rem"
					});
					$$renderer.push(`<!----></div>`);
				}
				$$renderer.push(`<!--]--> <span class="shortcut-name svelte-1w3wmc2">${escape_html(shortcut.name)}</span></button>`);
			}
			$$renderer.push(`<!--]--></div>`);
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]-->`);
	});
}
// src/lib/Main/SpotifyPlayer.svelte
function SpotifyPlayer($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		var $$store_subs;
		let { sel, sectionName = void 0, large = false } = $$props;
		let entity_id = derived(() => sel?.entity_id);
		let name = derived(() => sel?.name);
		let icon = derived(() => sel?.icon || "mdi:spotify");
		let color = derived(() => sel?.color || "rgb(30, 215, 96)");
		let show_progress = derived(() => sel?.show_progress ?? true);
		let shortcuts = derived(() => sel?.shortcuts ?? []);
		let entity = derived(() => entity_id() ? store_get($$store_subs ??= {}, "$states", states)?.[entity_id()] : void 0);
		let entityState = derived(() => entity()?.state);
		let attributes = derived(() => entity()?.attributes);
		let media_title = derived(() => attributes()?.media_title);
		let media_artist = derived(() => attributes()?.media_artist);
		let media_album_name = derived(() => attributes()?.media_album_name);
		let entity_picture = derived(() => attributes()?.entity_picture);
		let is_playing = derived(() => entityState() === "playing");
		let is_idle = derived(() => entityState() === "idle" || !entity());
		let recentArtwork = [];
		let rotatingImageA = "";
		let rotatingImageB = "";
		let media_duration = derived(() => attributes()?.media_duration);
		let media_position = derived(() => attributes()?.media_position);
		let media_position_updated_at = derived(() => attributes()?.media_position_updated_at);
		let current_position = derived(() => calculatePosition(media_position(), media_position_updated_at(), is_playing(), store_get($$store_subs ??= {}, "$timer", timer)));
		let progress_percent = derived(() => media_duration() && current_position() ? current_position() / media_duration() * 100 : 0);
		function calculatePosition(position, updated_at, playing, currentTime) {
			if (!position || !updated_at) return 0;
			if (!playing) return position;
			const updatedDate = new Date(updated_at);
			const elapsed = position + (currentTime.getTime() - updatedDate.getTime()) / 1e3;
			return media_duration() ? Math.min(elapsed, media_duration()) : elapsed;
		}
		let display_title = derived(() => media_title() || name() || store_get($$store_subs ??= {}, "$lang", lang)("spotify_player") || "Spotify");
		let display_artist = derived(() => media_artist() || (is_idle() ? store_get($$store_subs ??= {}, "$lang", lang)("nothing_playing") || "Idle" : entityState()));
		$$renderer.push(`<div${attr_class("container svelte-gwc6t6", void 0, { "large": large })} tabindex="-1" role="button"${attr_style("", {
			cursor: !store_get($$store_subs ??= {}, "$editMode", editMode) ? "pointer" : "",
			"min-height": large ? void 0 : `${store_get($$store_subs ??= {}, "$itemHeight", itemHeight)}px`,
			height: large ? `calc(${store_get($$store_subs ??= {}, "$itemHeight", itemHeight)}px * 4 + 0.4rem * 3)` : void 0,
			"background-image": large && entity_picture() && is_playing() ? `url(${entity_picture()})` : ""
		})}>`);
		if (entity_picture() && is_playing()) {
			$$renderer.push("<!--[0-->");
			if (!large) {
				$$renderer.push("<!--[0-->");
				$$renderer.push(`<div class="background-image svelte-gwc6t6"${attr_style("", { "background-image": `url(${stringify(entity_picture())})` })}></div>`);
			} else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--> <div class="background-overlay svelte-gwc6t6"></div>`);
		} else if (recentArtwork.length > 0 && !is_playing()) {
			$$renderer.push("<!--[1-->");
			$$renderer.push(`<div class="background-image rotating svelte-gwc6t6"${attr_style("", {
				"background-image": `url(${stringify(rotatingImageA)})`,
				opacity: 1
			})}></div> `);
			if (recentArtwork.length > 1) {
				$$renderer.push("<!--[0-->");
				$$renderer.push(`<div class="background-image rotating svelte-gwc6t6"${attr_style("", {
					"background-image": `url(${stringify(rotatingImageB)})`,
					opacity: 0
				})}></div>`);
			} else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--> <div class="background-overlay idle svelte-gwc6t6"></div>`);
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--> `);
		if (large && !is_playing() && shortcuts().length > 0) {
			$$renderer.push("<!--[0-->");
			SpotifyShortcuts($$renderer, {
				shortcuts: shortcuts(),
				entity_id: entity_id(),
				default_device: sel?.default_device,
				layout: "large"
			});
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--> <div class="content svelte-gwc6t6"><div class="left svelte-gwc6t6"><div class="icon svelte-gwc6t6"${attr_style("", {
			"--icon-color": color(),
			"background-color": color()
		})}>`);
		Icon($$renderer, {
			icon: icon(),
			height: "none",
			width: "100%"
		});
		$$renderer.push(`<!----> `);
		if (is_playing()) {
			$$renderer.push("<!--[0-->");
			$$renderer.push(`<div class="playing-indicator svelte-gwc6t6">`);
			Icon($$renderer, {
				icon: "mdi:music-note",
				height: large ? "1.2rem" : "1rem"
			});
			$$renderer.push(`<!----></div>`);
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--></div></div> <div class="right svelte-gwc6t6"><div class="name svelte-gwc6t6">${escape_html(display_title())}</div> <div class="state svelte-gwc6t6">${escape_html(display_artist())} `);
		if (large && media_album_name()) {
			$$renderer.push("<!--[0-->");
			$$renderer.push(`• ${escape_html(media_album_name())}`);
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--></div> `);
		if (show_progress() && !is_idle() && media_duration() && progress_percent() > 0) {
			$$renderer.push("<!--[0-->");
			$$renderer.push(`<div class="progress-container svelte-gwc6t6"><div class="progress-bar svelte-gwc6t6"><div class="progress-fill svelte-gwc6t6"${attr_style("", { width: `${stringify(Math.min(progress_percent(), 100))}%` })}></div></div></div>`);
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--> `);
		if (!large && !is_playing() && shortcuts().length > 0) {
			$$renderer.push("<!--[0-->");
			SpotifyShortcuts($$renderer, {
				shortcuts: shortcuts(),
				entity_id: entity_id(),
				default_device: sel?.default_device,
				layout: "compact"
			});
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--></div></div></div>`);
		if ($$store_subs) unsubscribe_stores($$store_subs);
	});
}
// src/lib/Main/Content.svelte
function Content($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { item, sectionName = void 0 } = $$props;
		if (item?.type === "configure") {
			$$renderer.push("<!--[0-->");
			Configure($$renderer, { sel: item });
		} else if (item?.type === "button") {
			$$renderer.push("<!--[1-->");
			Button($$renderer, {
				sel: item,
				sectionName
			});
		} else if (item?.type === "days_since") {
			$$renderer.push("<!--[2-->");
			DaysSince($$renderer, {
				sel: item});
		} else if (item?.type === "entities") {
			$$renderer.push("<!--[3-->");
			Entities($$renderer, {
				sel: item});
		} else if (item?.type === "spotify_player") {
			$$renderer.push("<!--[4-->");
			SpotifyPlayer($$renderer, {
				sel: item,
				sectionName
			});
		} else if (item?.type === "spotify_player_large") {
			$$renderer.push("<!--[5-->");
			SpotifyPlayer($$renderer, {
				sel: item,
				sectionName,
				large: true
			});
		} else if (item?.type === "conditional_media") {
			$$renderer.push("<!--[6-->");
			ConditionalMedia($$renderer, { sel: item });
		} else if (item?.type === "picture_elements") {
			$$renderer.push("<!--[7-->");
			PictureElements($$renderer, { sel: item });
		} else if (item?.type === "camera") {
			$$renderer.push("<!--[8-->");
			Camera($$renderer, {
				sel: item,
				responsive: false,
				muted: true,
				controls: false
			});
		} else if (item?.type === "empty") {
			$$renderer.push("<!--[9-->");
			Empty($$renderer);
		} else {
			$$renderer.push("<!--[-1-->");
			Configure($$renderer, { sel: { id: item?.id } });
		}
		$$renderer.push(`<!--]-->`);
	});
}
// src/lib/Main/DragIndicator.svelte
function DragIndicator($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		var $$store_subs;
		$$renderer.push(`<div class="drag-handle svelte-4zcatm"${attr("title", store_get($$store_subs ??= {}, "$lang", lang)("drag_and_drop"))}><div class="icon svelte-4zcatm">`);
		Icon($$renderer, {
			icon: "mdi:drag",
			height: "none"
		});
		$$renderer.push(`<!----></div></div>`);
		if ($$store_subs) unsubscribe_stores($$store_subs);
	});
}
// src/lib/Main/DeleteButton.svelte
function DeleteButton($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		var $$store_subs;
		let { view, section } = $$props;
		$$renderer.push(`<button${attr("title", store_get($$store_subs ??= {}, "$lang", lang)("remove"))} class="svelte-1qaaxgw"><div class="icon svelte-1qaaxgw">`);
		Icon($$renderer, {
			icon: "ic:round-delete",
			height: "none"
		});
		$$renderer.push(`<!----></div></button>`);
		if ($$store_subs) unsubscribe_stores($$store_subs);
	});
}
// src/lib/Conditional.ts
/**
* Checks every section in a view
* Runs whenever paramerers changes
*/
function handleVisibility($editMode, sections, states) {
	const viewSections = [];
	sections.forEach((section) => {
		if (handleAllConditions($editMode, states, section)) {
			if ((section.type === "horizontal-stack" || section.type === "vertical-stack") && section.sections) {
				const stack = section.sections.filter((nested) => handleAllConditions($editMode, states, nested)).map((nested) => {
					if (nested.type === "vertical-stack" && nested.sections) {
						const nestedStack = nested.sections.filter((deepNested) => handleAllConditions($editMode, states, deepNested));
						if (nestedStack.length > 0) return {
							...nested,
							sections: nestedStack
						};
						return null;
					}
					return nested;
				}).filter((nested) => nested !== null);
				if (stack.length > 0) {
					section = {
						...section,
						sections: stack
					};
					viewSections.push(section);
				}
			} else viewSections.push(section);
		}
	});
	return viewSections;
}
/**
* Handles every section in handleVisibility
*/
function handleAllConditions($editMode, $states, section) {
	if (!$states || !section?.visibility) return true;
	return section.visibility.every((condition) => validateCondition($editMode, $states, section, condition));
}
/**
* Validates every condition in handleAllConditions
*/
function validateCondition($editMode, $states, section, condition) {
	switch (condition?.condition) {
		case "and": return handleAnd($editMode, $states, section, condition);
		case "or": return handleOr($editMode, $states, section, condition);
		case "state": return handleState($states, condition);
		case "numeric_state": return handleNumericState($states, condition);
		case "screen": return handleScreen($editMode, section, condition);
		default: return false;
	}
}
/**
* State
*/
function handleState($states, conditions) {
	if (!conditions?.entity || !$states?.[conditions?.entity]) return false;
	const entityState = $states?.[conditions?.entity]?.state;
	if (typeof conditions?.state !== "undefined" && conditions?.state !== "") return entityState === conditions?.state;
	else if (typeof conditions?.state_not !== "undefined" && conditions?.state_not !== "") return entityState !== conditions?.state_not;
	else return false;
}
/**
* Numeric
*/
function handleNumericState($states, conditions) {
	if (!conditions?.entity || !$states?.[conditions?.entity]) return false;
	const entityState = parseFloat($states?.[conditions?.entity]?.state);
	if (isNaN(entityState)) return false;
	else if (typeof conditions?.above === "number" && typeof conditions?.below === "number") return entityState > conditions?.above && entityState < conditions?.below;
	else if (typeof conditions?.above === "number") return entityState > conditions?.above;
	else if (typeof conditions?.below === "number") return entityState < conditions?.below;
	else return false;
}
/**
* And
*/
function handleAnd($editMode, $states, section, condition) {
	if (!condition.conditions?.length) return false;
	return condition.conditions?.every((subCondition) => validateCondition($editMode, $states, section, subCondition)) ?? false;
}
/**
* Or
*/
function handleOr($editMode, $states, section, condition) {
	if (!condition.conditions?.length) return false;
	return condition.conditions?.some((subCondition) => validateCondition($editMode, $states, section, subCondition)) ?? false;
}
var mediaQueries = writable({});
function handleScreen($editMode, section, conditions) {
	const id = section?.id;
	if (!id || !conditions?.media_query) return false;
	if ($editMode) return window?.matchMedia(conditions?.media_query)?.matches;
	const prev = get(mediaQueries)?.[id];
	if (prev?.mql && prev?.listener) {
		prev?.mql?.removeEventListener("change", prev?.listener);
		delete prev?.listener;
	}
	const mql = window?.matchMedia(conditions?.media_query);
	const listener = () => {
		mediaQueries?.update((mqs) => ({
			...mqs,
			[id]: {
				...mqs?.[id],
				matches: mql?.matches
			}
		}));
	};
	mql?.addEventListener("change", listener);
	mediaQueries?.update((mqs) => {
		return {
			...mqs,
			[id]: {
				mql,
				listener,
				matches: mql?.matches
			}
		};
	});
	return mql?.matches;
}
// src/lib/Main/VisibilitySectionButton.svelte
function VisibilitySectionButton($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		var $$store_subs;
		let { section } = $$props;
		/**
		* Checks if `visibility` exists on current section
		*/
		let conditions = derived(() => section?.visibility && section?.visibility?.length > 0);
		/**
		* Evaluates all conditions in section `visibility`
		*/
		let visible = derived(() => handleAllConditions(store_get($$store_subs ??= {}, "$editMode", editMode), store_get($$store_subs ??= {}, "$states", states), section));
		$$renderer.push(`<button${attr("title", !conditions() ? store_get($$store_subs ??= {}, "$lang", lang)("visibility") : store_get($$store_subs ??= {}, "$lang", lang)(visible() ? "visible" : "hidden"))} class="svelte-z90q16"${attr_style("", {
			color: conditions() ? "#3b0f0f" : "inherit",
			"background-color": conditions() ? "#ffc008" : "var(--theme-button-background-color-off)",
			transition: `background-color ${stringify(store_get($$store_subs ??= {}, "$motion", motion))}ms ease`
		})}><div class="icon svelte-z90q16">`);
		Icon($$renderer, {
			icon: visible() ? "lucide:eye" : "lucide:eye-off",
			height: "none"
		});
		$$renderer.push(`<!----></div></button>`);
		if ($$store_subs) unsubscribe_stores($$store_subs);
	});
}
// src/lib/Main/SectionTitle.svelte
function SectionTitle($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		var $$store_subs;
		let { value: initialValue} = $$props;
		let value = derived(() => initialValue);
		$$renderer.push(`<div class="hidden svelte-y295wg">`);
		if (value() === "") {
			$$renderer.push("<!--[0-->");
			$$renderer.push(`${escape_html(store_get($$store_subs ??= {}, "$lang", lang)("section"))}`);
		} else {
			$$renderer.push("<!--[-1-->");
			$$renderer.push(`${html(value().replaceAll(" ", "&nbsp;"))}`);
		}
		$$renderer.push(`<!--]--></div> <form><input class="input svelte-y295wg"${attr("name", value())}${attr("value", value())} autocomplete="off" spellcheck="false"${attr("placeholder", store_get($$store_subs ??= {}, "$lang", lang)("section"))}${attr_style("", { width: `${stringify(NaN)}px` })}/></form>`);
		if ($$store_subs) unsubscribe_stores($$store_subs);
	});
}
// src/lib/Main/SectionHeader.svelte
function SectionHeader($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		var $$store_subs;
		let { view, section } = $$props;
		if (section?.name !== "" || store_get($$store_subs ??= {}, "$editMode", editMode)) {
			$$renderer.push("<!--[0-->");
			$$renderer.push(`<header class="svelte-1m3cf33"><h1 class="svelte-1m3cf33"${attr_style("", { cursor: store_get($$store_subs ??= {}, "$editMode", editMode) ? "text" : "initial" })}>`);
			if (store_get($$store_subs ??= {}, "$editMode", editMode)) {
				$$renderer.push("<!--[0-->");
				SectionTitle($$renderer, {
					value: section.name});
			} else if (section?.name === "") {
				$$renderer.push("<!--[1-->");
				$$renderer.push(`${html("&nbsp;")}`);
			} else {
				$$renderer.push("<!--[-1-->");
				$$renderer.push(`${escape_html(section?.name)}`);
			}
			$$renderer.push(`<!--]--></h1> `);
			if (store_get($$store_subs ??= {}, "$editMode", editMode)) {
				$$renderer.push("<!--[0-->");
				$$renderer.push(`<div class="right svelte-1m3cf33">`);
				DragIndicator($$renderer);
				$$renderer.push(`<!----> `);
				VisibilitySectionButton($$renderer, { section });
				$$renderer.push(`<!----> `);
				DeleteButton($$renderer, {
					view,
					section
				});
				$$renderer.push(`<!----></div>`);
			} else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--></header>`);
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]-->`);
		if ($$store_subs) unsubscribe_stores($$store_subs);
	});
}
// src/lib/Main/HorizontalStackHeader.svelte
function HorizontalStackHeader($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		var $$store_subs;
		let { view, section } = $$props;
		if (store_get($$store_subs ??= {}, "$editMode", editMode)) {
			$$renderer.push("<!--[0-->");
			$$renderer.push(`<header class="svelte-2xnw6k"><span class="title svelte-2xnw6k">${escape_html(store_get($$store_subs ??= {}, "$lang", lang)("horizontal_stack"))}</span> <span class="right svelte-2xnw6k">`);
			DragIndicator($$renderer);
			$$renderer.push(`<!----> `);
			VisibilitySectionButton($$renderer, { section });
			$$renderer.push(`<!----> `);
			DeleteButton($$renderer, {
				view,
				section
			});
			$$renderer.push(`<!----></span></header>`);
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]-->`);
		if ($$store_subs) unsubscribe_stores($$store_subs);
	});
}
// src/lib/Main/VerticalStackHeader.svelte
function VerticalStackHeader($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		var $$store_subs;
		let { view, section } = $$props;
		if (store_get($$store_subs ??= {}, "$editMode", editMode)) {
			$$renderer.push("<!--[0-->");
			$$renderer.push(`<header class="svelte-vhhpq"><span class="title svelte-vhhpq">${escape_html(store_get($$store_subs ??= {}, "$lang", lang)("vertical_stack"))}</span> <span class="right svelte-vhhpq">`);
			DragIndicator($$renderer);
			$$renderer.push(`<!----> `);
			VisibilitySectionButton($$renderer, { section });
			$$renderer.push(`<!----> `);
			DeleteButton($$renderer, {
				view,
				section
			});
			$$renderer.push(`<!----></span></header>`);
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]-->`);
		if ($$store_subs) unsubscribe_stores($$store_subs);
	});
}
// src/lib/Main/Scenes.svelte
function Scenes($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		var $$store_subs;
		let { sel } = $$props;
		let active = false;
		let timeout;
		const iconSize = "2rem";
		let icon = derived(() => sel?.icon);
		onDestroy(() => clearTimeout(timeout));
		if (sel?.type === "configure") {
			$$renderer.push("<!--[0-->");
			Configure($$renderer, { sel });
		} else {
			$$renderer.push("<!--[-1-->");
			$$renderer.push(`<div${attr_class("btn svelte-xubjii", void 0, { "active": active })}${attr_style("", {
				transition: `background-color ${stringify(store_get($$store_subs ??= {}, "$motion", motion))}ms ease`,
				cursor: store_get($$store_subs ??= {}, "$editMode", editMode) ? "unset" : "pointer"
			})}><div class="icon svelte-xubjii">`);
			if (icon()) {
				$$renderer.push("<!--[0-->");
				await_block($$renderer, loadIcon(icon()), () => {
					Icon($$renderer, {
						icon: "ph:dot",
						style: "font-size: 2rem"
					});
				}, (resolvedIcon) => {
					Icon($$renderer, {
						icon: resolvedIcon,
						style: "font-size: 2rem"
					});
				});
				$$renderer.push(`<!--]-->`);
			} else if (sel?.entity_id) {
				$$renderer.push("<!--[1-->");
				ComputeIcon($$renderer, {
					entity_id: sel?.entity_id,
					skipEntityPicture: true,
					size: iconSize
				});
			} else {
				$$renderer.push("<!--[-1-->");
				Icon($$renderer, {
					icon: "ooui:help-ltr",
					style: "font-size: 2rem"
				});
			}
			$$renderer.push(`<!--]--></div> <div class="name svelte-xubjii">${escape_html(getName(sel, store_get($$store_subs ??= {}, "$states", states)?.[sel?.entity_id]))}</div></div>`);
		}
		$$renderer.push(`<!--]-->`);
		if ($$store_subs) unsubscribe_stores($$store_subs);
	});
}
// src/lib/Main/Index.svelte
function Index($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		var $$store_subs;
		let { view, altKeyPressed } = $$props;
		const stackHeight = store_get($$store_subs ??= {}, "$itemHeight", itemHeight) * 1.65;
		function sectionStyles(sectionType, editMode, motion, empty) {
			return `
			min-height: ${sectionType === "scenes" ? "4.8rem" : `${store_get($$store_subs ??= {}, "$itemHeight", itemHeight)}px`};
			background-color: ${empty ? "rgba(255, 190, 10, 0.25)" : sectionType === "scenes" ? "rgba(0, 0, 0, 0.125)" : "transparent"};
			outline: ${empty ? "2px dashed #ffc107" : "none"};
			transition: ${editMode ? `background-color ${motion / 2}ms ease, min-height ${motion}ms ease` : "none"};
    `;
		}
		function itemStyles(type) {
			const large = [
				"conditional_media",
				"picture_elements",
				"camera",
				"spotify_player_large",
				"entities"
			];
			return `
			grid-column: ${large.includes(type) ? "span 2" : "span 1"};
			grid-row: ${large.includes(type) ? "span 4" : "span 1"};
			display: ${type ? "" : "none"};
    `;
		}
		let viewSections = derived(() => store_get($$store_subs ??= {}, "$editMode", editMode) ? view?.sections : typeof store_get($$store_subs ??= {}, "$mediaQueries", mediaQueries) === "object" && handleVisibility(store_get($$store_subs ??= {}, "$editMode", editMode), view?.sections, store_get($$store_subs ??= {}, "$states", states)));
		$$renderer.push(`<main class="svelte-z5t3v5"${attr_style("", {
			transition: `opacity ${stringify(store_get($$store_subs ??= {}, "$motion", motion))}ms ease, outline-color ${stringify(store_get($$store_subs ??= {}, "$motion", motion))}ms ease`,
			opacity: store_get($$store_subs ??= {}, "$editMode", editMode) && view?.sections.length === 0 ? "0" : "1"
		})}><!--[-->`);
		const each_array = ensure_array_like(viewSections());
		for (let $$index_8 = 0, $$length = each_array.length; $$index_8 < $$length; $$index_8++) {
			let section = each_array[$$index_8];
			$$renderer.push(`<section${attr("id", String(section?.id))}${attr("data-id", section?.id)}${attr("data-section-type", section?.type)} class="svelte-z5t3v5">`);
			if (section?.type === "horizontal-stack") {
				$$renderer.push("<!--[0-->");
				HorizontalStackHeader($$renderer, {
					view,
					section
				});
				$$renderer.push(`<!----> <div class="horizontal-stack svelte-z5t3v5"${attr_style("", {
					"min-height": `${stringify(stackHeight)}px`,
					outline: `2px dashed ${store_get($$store_subs ??= {}, "$editMode", editMode) ? "#ffc008" : "transparent"}`,
					transition: `min-height ${stringify(store_get($$store_subs ??= {}, "$motion", motion))}ms ease, outline ${stringify(store_get($$store_subs ??= {}, "$motion", motion) / 2)}ms ease`
				})}><!--[-->`);
				const each_array_1 = ensure_array_like(section?.sections ?? []);
				for (let $$index_3 = 0, $$length = each_array_1.length; $$index_3 < $$length; $$index_3++) {
					let stackSection = each_array_1[$$index_3];
					$$renderer.push(`<section${attr("id", String(stackSection.id))}${attr("data-id", stackSection.id)}${attr("data-section-type", stackSection?.type)} class="svelte-z5t3v5"${attr_style("", { overflow: "hidden" })}>`);
					if (stackSection?.type === "vertical-stack") {
						$$renderer.push("<!--[0-->");
						VerticalStackHeader($$renderer, {
							view,
							section: stackSection
						});
						$$renderer.push(`<!----> <div class="vertical-stack nested svelte-z5t3v5"${attr_style("", {
							"min-height": `${stringify(stackHeight)}px`,
							outline: `2px dashed ${store_get($$store_subs ??= {}, "$editMode", editMode) ? "#08c7ff" : "transparent"}`,
							transition: `min-height ${stringify(store_get($$store_subs ??= {}, "$motion", motion))}ms ease, outline ${stringify(store_get($$store_subs ??= {}, "$motion", motion) / 2)}ms ease`
						})}><!--[-->`);
						const each_array_2 = ensure_array_like(stackSection?.sections ?? []);
						for (let $$index_1 = 0, $$length = each_array_2.length; $$index_1 < $$length; $$index_1++) {
							let nestedSection = each_array_2[$$index_1];
							const empty = store_get($$store_subs ??= {}, "$editMode", editMode) && !nestedSection?.items?.length;
							$$renderer.push(`<section${attr("id", String(nestedSection.id))}${attr("data-id", nestedSection.id)}${attr("data-section-type", nestedSection?.type)} class="svelte-z5t3v5"${attr_style("", { overflow: "hidden" })}>`);
							SectionHeader($$renderer, {
								view,
								section: nestedSection
							});
							$$renderer.push(`<!----> <div class="items svelte-z5t3v5"${attr_style(sectionStyles(stackSection?.type, store_get($$store_subs ??= {}, "$editMode", editMode), store_get($$store_subs ??= {}, "$motion", motion), empty))}><!--[-->`);
							const each_array_3 = ensure_array_like(nestedSection?.items ?? []);
							for (let $$index = 0, $$length = each_array_3.length; $$index < $$length; $$index++) {
								let item = each_array_3[$$index];
								$$renderer.push(`<div${attr("data-id", item?.id)} class="item svelte-z5t3v5" tabindex="-1"${attr_style(itemStyles(item?.type))}>`);
								Content($$renderer, {
									item,
									sectionName: nestedSection?.name
								});
								$$renderer.push(`<!----></div>`);
							}
							$$renderer.push(`<!--]--></div></section>`);
						}
						$$renderer.push(`<!--]--></div>`);
					} else {
						$$renderer.push("<!--[-1-->");
						const empty = store_get($$store_subs ??= {}, "$editMode", editMode) && !stackSection?.items?.length;
						SectionHeader($$renderer, {
							view,
							section: stackSection
						});
						$$renderer.push(`<!----> <div class="items svelte-z5t3v5"${attr_style(sectionStyles(section?.type, store_get($$store_subs ??= {}, "$editMode", editMode), store_get($$store_subs ??= {}, "$motion", motion), empty))}><!--[-->`);
						const each_array_4 = ensure_array_like(stackSection?.items ?? []);
						for (let $$index_2 = 0, $$length = each_array_4.length; $$index_2 < $$length; $$index_2++) {
							let item = each_array_4[$$index_2];
							$$renderer.push(`<div${attr("data-id", item?.id)} class="item svelte-z5t3v5" tabindex="-1"${attr_style(itemStyles(item?.type))}>`);
							Content($$renderer, {
								item,
								sectionName: stackSection?.name
							});
							$$renderer.push(`<!----></div>`);
						}
						$$renderer.push(`<!--]--></div>`);
					}
					$$renderer.push(`<!--]--></section>`);
				}
				$$renderer.push(`<!--]--></div>`);
			} else if (section?.type === "vertical-stack") {
				$$renderer.push("<!--[1-->");
				VerticalStackHeader($$renderer, {
					view,
					section
				});
				$$renderer.push(`<!----> <div class="vertical-stack svelte-z5t3v5"${attr_style("", {
					"min-height": `${stringify(stackHeight)}px`,
					outline: `2px dashed ${store_get($$store_subs ??= {}, "$editMode", editMode) ? "#08c7ff" : "transparent"}`,
					transition: `min-height ${stringify(store_get($$store_subs ??= {}, "$motion", motion))}ms ease, outline ${stringify(store_get($$store_subs ??= {}, "$motion", motion) / 2)}ms ease`
				})}><!--[-->`);
				const each_array_5 = ensure_array_like(section?.sections ?? []);
				for (let $$index_5 = 0, $$length = each_array_5.length; $$index_5 < $$length; $$index_5++) {
					let stackSection = each_array_5[$$index_5];
					const empty = store_get($$store_subs ??= {}, "$editMode", editMode) && !stackSection?.items?.length;
					$$renderer.push(`<section${attr("id", String(stackSection.id))}${attr("data-id", stackSection.id)}${attr("data-section-type", stackSection?.type)} class="svelte-z5t3v5"${attr_style("", { overflow: "hidden" })}>`);
					SectionHeader($$renderer, {
						view,
						section: stackSection
					});
					$$renderer.push(`<!----> <div class="items svelte-z5t3v5"${attr_style(sectionStyles(section?.type, store_get($$store_subs ??= {}, "$editMode", editMode), store_get($$store_subs ??= {}, "$motion", motion), empty))}><!--[-->`);
					const each_array_6 = ensure_array_like(stackSection?.items ?? []);
					for (let $$index_4 = 0, $$length = each_array_6.length; $$index_4 < $$length; $$index_4++) {
						let item = each_array_6[$$index_4];
						$$renderer.push(`<div${attr("data-id", item?.id)} class="item svelte-z5t3v5" tabindex="-1"${attr_style(itemStyles(item?.type))}>`);
						Content($$renderer, {
							item,
							sectionName: stackSection?.name
						});
						$$renderer.push(`<!----></div>`);
					}
					$$renderer.push(`<!--]--></div></section>`);
				}
				$$renderer.push(`<!--]--></div>`);
			} else if (section?.type === "scenes") {
				$$renderer.push("<!--[2-->");
				const empty = store_get($$store_subs ??= {}, "$editMode", editMode) && !section?.items?.length;
				SectionHeader($$renderer, {
					view,
					section
				});
				$$renderer.push(`<!----> <div class="scenes svelte-z5t3v5"${attr_style(sectionStyles(section?.type, store_get($$store_subs ??= {}, "$editMode", editMode), store_get($$store_subs ??= {}, "$motion", motion), empty))}><!--[-->`);
				const each_array_7 = ensure_array_like(section?.items ?? []);
				for (let index = 0, $$length = each_array_7.length; index < $$length; index++) {
					let item = each_array_7[index];
					$$renderer.push(`<div${attr("data-id", item?.id)} tabindex="-1"${attr_class("svelte-z5t3v5", void 0, { "divider": index !== section?.items?.length - 1 })}>`);
					Scenes($$renderer, { sel: item });
					$$renderer.push(`<!----></div>`);
				}
				$$renderer.push(`<!--]--></div>`);
			} else {
				$$renderer.push("<!--[-1-->");
				const empty = store_get($$store_subs ??= {}, "$editMode", editMode) && !section?.items?.length;
				SectionHeader($$renderer, {
					view,
					section
				});
				$$renderer.push(`<!----> <div class="items svelte-z5t3v5"${attr_style(sectionStyles(section?.type, store_get($$store_subs ??= {}, "$editMode", editMode), store_get($$store_subs ??= {}, "$motion", motion), empty))}><!--[-->`);
				const each_array_8 = ensure_array_like(section?.items ?? []);
				for (let $$index_7 = 0, $$length = each_array_8.length; $$index_7 < $$length; $$index_7++) {
					let item = each_array_8[$$index_7];
					$$renderer.push(`<div${attr("data-id", item?.id)} class="item svelte-z5t3v5" tabindex="-1"${attr_style(itemStyles(item?.type))}>`);
					Content($$renderer, {
						item,
						sectionName: section?.name
					});
					$$renderer.push(`<!----></div>`);
				}
				$$renderer.push(`<!--]--></div>`);
			}
			$$renderer.push(`<!--]--></section>`);
		}
		$$renderer.push(`<!--]--></main>`);
		if ($$store_subs) unsubscribe_stores($$store_subs);
	});
}

export { Index as default };
//# sourceMappingURL=Index2.js-DxGqxkde.js.map
