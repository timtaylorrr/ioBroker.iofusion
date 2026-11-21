<script lang="ts">
	import { base } from '$app/paths';
	import { dashboard } from '$lib/Stores';

	let { initial = $bindable() }: { initial: any } = $props();

	let css = $derived.by(() => {
		const result = Object.entries(initial?.theme || {})
			.map(([key, value]) => {
				if (typeof value === 'string' && value.includes('/themes/')) {
					value = value.replace('/', `${base}/`);
				}
				return `--theme-${key}: ${value};`;
			})
			.join(' ');

		if ($dashboard?.theme && !import.meta.env.SSR) {
			if (initial?.title !== $dashboard.theme) {
				loadTheme($dashboard.theme);
			}
		}

		return result;
	});

	// lets design.css target a theme, e.g. html[data-theme='iofusion']
	$effect(() => {
		if (initial?.title) document.documentElement.dataset.theme = initial.title;
	});

	/**
	 * Load theme by name from backend
	 */
	async function loadTheme(name: string) {
		try {
			const response = await fetch(`${base}/_api/load_theme`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ theme: name })
			});

			const data = await response.json();

			if (response.ok) {
				initial = data;
			} else {
				throw new Error(data.message);
			}
		} catch (error) {
			console.error(error);
		}
	}
</script>

<svelte:head>
	{@html `<style>:root {${css}}</style>`}
	<meta name="theme-color" content={initial?.theme?.['app-color']} />
</svelte:head>
