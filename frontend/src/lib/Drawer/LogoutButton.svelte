<script lang="ts">
	import { lang, ripple } from '$lib/Stores';
	import Icon from '@iconify/svelte';
	import Ripple from '$lib/Actions/ripple';
	import { base } from '$app/paths';

	/** ioFusion: ends the login session (the adapter serves /logout) */
	function handleClick() {
		window.location.href = `${base}/logout`;
	}
</script>

<button class="button" onclick={handleClick} use:Ripple={$ripple}>
	<figure>
		<Icon icon="mdi:logout" height="none" />
	</figure>

	<span>{$lang('logout')}</span>
</button>

<style>
	span {
		text-transform: capitalize;
	}
</style>
