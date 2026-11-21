<script lang="ts">
	import ComputeIcon from '$lib/Components/ComputeIcon.svelte';
	import { motion } from '$lib/Stores';
	import { tick } from 'svelte';
	import VirtualList from 'svelte-tiny-virtual-list';
	type Alignment = 'auto' | 'start' | 'center' | 'end';
	type ScrollBehaviour = 'auto' | 'smooth' | 'instant';
	import { scale, slide } from 'svelte/transition';
	import Icon from '@iconify/svelte';
	import { expoOut } from 'svelte/easing';
	let {
		value = $bindable(undefined),
		placeholder,
		computeIcons = undefined,
		getIconString = undefined,
		defaultIcon = undefined,
		clearable = undefined,
		options,
		onchange = undefined,
		oniconString = undefined
	}: {
		value?: string | undefined;
		placeholder: string;
		computeIcons?: boolean | undefined;
		getIconString?: boolean | undefined;
		defaultIcon?: string | undefined;
		clearable?: boolean | undefined;
		options: {
			id: string;
			label: string;
			hint?: string;
			icon?: string;
			/** optional group (e.g. ioBroker parent path), rendered as collapsible header */
			group?: string;
		}[];
		onchange?: ((value: string | undefined) => void) | undefined;
		oniconString?: ((value: string | undefined) => void) | undefined;
	} = $props();

	const DEBUG = false;
	let listOpen = $state(false);
	let search = $state('');
	let wrapper = $state<HTMLDivElement>();
	let input = $state<HTMLInputElement>();
	let selectedIndex = $state<number>(0);
	let highlightedIndex = $state(0);
	let scrollToIndex = $state(0);
	let scrollToAlignment = $state<Alignment>('auto');
	const scrollToBehaviour: ScrollBehaviour = 'instant';
	const itemSize = 50;
	const maxHeight = itemSize * 7;
	const overscanCount = 7;

	let previousValue = $state(value);
	$effect(() => {
		if (value !== previousValue) {
			previousValue = value;
			if ((value === undefined && clearable) || value) {
				onchange?.(value);
			}
		}
	});

	$effect(() => {
		if (!listOpen) {
			search = '';
			selectedIndex = options?.findIndex((option: { id: string }) => option.id === value);
		}
	});

	let filter = $derived(
		options && listOpen
			? options.filter(
					(option: { id: string; label: string }) =>
						!search ||
						option.label.toLowerCase().includes(search.toLowerCase()) ||
						option.id.toLowerCase().includes(search.toLowerCase())
				)
			: []
	);
	// grouping (ioFusion): options with a `group` (ioBroker parent path) are shown as a
	// collapsible tree, one level per path segment, like the ioBroker object view
	type Opt = (typeof filter)[number];
	type Row =
		| { kind: 'header'; path: string; name: string; depth: number; count: number; open: boolean }
		| { kind: 'option'; option: Opt; depth: number };
	type TreeNode = { children: Map<string, TreeNode>; options: Opt[]; count: number };
	let expanded = $state<Record<string, boolean>>({});
	let grouped = $derived(!!options?.some((option) => option.group));
	let rows = $derived.by<Row[]>(() => {
		if (!filter) return [];
		if (!grouped) return filter.map((option) => ({ kind: 'option', option, depth: 0 }));

		// build the tree
		const root: TreeNode = { children: new Map(), options: [], count: 0 };
		for (const option of filter) {
			if (!option.group) {
				root.options.push(option);
				continue;
			}
			let node = root;
			// adapter and instance form one level, like `hm-rpc.0` in ioBroker
			const parts = option.group.split('.');
			if (parts.length > 1 && /^\d+$/.test(parts[1])) parts.splice(0, 2, `${parts[0]}.${parts[1]}`);
			for (const segment of parts) {
				if (!node.children.has(segment)) {
					node.children.set(segment, { children: new Map(), options: [], count: 0 });
				}
				node = node.children.get(segment)!;
				node.count++;
			}
			node.options.push(option);
		}

		// nodes on the way to the selected value stay open
		const selectedGroup = options?.find((option) => option.id === value)?.group ?? '';
		const result: Row[] = [];
		const emit = (node: TreeNode, prefix: string, depth: number) => {
			node.options.sort((a, b) => a.label.localeCompare(b.label));
			for (const option of node.options) result.push({ kind: 'option', option, depth });
			for (const name of [...node.children.keys()].sort((a, b) => a.localeCompare(b))) {
				const child = node.children.get(name)!;
				const path = prefix ? `${prefix}.${name}` : name;
				const open =
					!!search ||
					!!expanded[path] ||
					selectedGroup === path ||
					selectedGroup.startsWith(`${path}.`);
				result.push({ kind: 'header', path, name, depth, count: child.count, open });
				if (open) emit(child, path, depth + 1);
			}
		};
		emit(root, '', 0);
		return result;
	});
	function toggleGroup(path: string) {
		const row = rows.find((r) => r.kind === 'header' && r.path === path);
		expanded[path] = row?.kind === 'header' ? !row.open : true;
	}
	function pick(index: number) {
		const row = rows[index];
		if (!row) return;
		if (row.kind === 'header') return toggleGroup(row.path);
		value = row.option.id;
		listOpen = false;
		if (input) input?.blur();
	}
	let height = $derived(rows && Math.min(rows.length * itemSize, maxHeight));
	let itemCount = $derived(rows?.length);
	let inputProps = $derived({
		type: 'text',
		class: 'input',
		placeholder,
		style: `padding-left: ${options?.[selectedIndex]?.icon || computeIcons ? '3.1rem' : '1rem'}`
	});
	function handleKeydown(event: any) {
		if (!listOpen) return;
		// up
		if (event.key === 'ArrowUp') {
			event.preventDefault();
			highlightedIndex = Math.max(highlightedIndex - 1, 0);
			scrollToIndex = highlightedIndex;
		}
		// down
		else if (event.key === 'ArrowDown') {
			event.preventDefault();
			highlightedIndex = Math.min(highlightedIndex + 1, rows.length - 1);
			scrollToIndex = highlightedIndex;
		}
		// enter
		else if (event.key === 'Enter') {
			const row = rows[highlightedIndex];
			if (row?.kind === 'header') {
				event.preventDefault();
				toggleGroup(row.path);
				return;
			}
			if (row?.kind === 'option') value = row.option.id;
			listOpen = false;
			if (input) input?.blur();
		}
		// escape
		else if (event.key === 'Escape') {
			event.stopPropagation();
			listOpen = false;
			if (input) input?.blur();
		}
		// tab
		else if (event.key === 'Tab') {
			listOpen = false;
		}
	}
	async function handleFocus() {
		// lookup index
		listOpen = true;
		await tick();
		const index = rows.findIndex((row) => row.kind === 'option' && row.option.id === value);
		// highlight index, align to 'start'
		if (index !== -1) {
			scrollToAlignment = 'start';
			highlightedIndex = index;
			scrollToIndex = highlightedIndex;
		}
		// reset alignment
		await tick();
		scrollToAlignment = 'auto';
	}
	function handlePointerDown(event: PointerEvent) {
		if (listOpen && wrapper && !wrapper.contains(event.target as Node) && event.target !== input) {
			listOpen = false;
		}
	}
</script>

<svelte:window onpointerdown={handlePointerDown} onkeydowncapture={handleKeydown} />
{#if DEBUG}
	<code style:color="#dfdf00">
		highlightedIndex: {highlightedIndex} <br />
		filter.length: {filter.length} <br />
		value: {value} <br />
		listOpen: {listOpen} <br />
		<br />
	</code>
{/if}
<div class="container">
	<div class="icon">
		{#if computeIcons && value}
			<!-- key value to properly update getIconString? -->
			{#key value}
				<ComputeIcon entity_id={value} {getIconString} {oniconString} />
			{/key}
		{:else if options?.[selectedIndex]?.icon}
			<Icon icon={String(options?.[selectedIndex]?.icon)} height="none" />
		{:else if !value && defaultIcon}
			<Icon icon={defaultIcon} height="none" />
		{/if}
	</div>
	{#if listOpen || !value || !clearable}
		<button
			class:chevron={!listOpen}
			class="icon close"
			style:transform={listOpen ? 'scaleY(-1)' : 'none'}
			style:transition="transform {$motion / 1.5}ms ease"
			transition:scale={{ duration: $motion }}
		>
			<Icon icon="octicon:chevron-down-12" height="none" />
		</button>
	{:else if value && clearable}
		<button
			class="icon close"
			onclick={() => {
				value = undefined;
			}}
			transition:scale={{ duration: $motion }}
		>
			<Icon icon="mingcute:close-fill" height="none" />
		</button>
	{/if}
	{#if listOpen}
		<input
			data-modal
			bind:value={search}
			bind:this={input}
			onfocus={handleFocus}
			oninput={() => {
				highlightedIndex = 0;
				scrollToIndex = highlightedIndex;
			}}
			{...inputProps}
		/>
	{:else}
		<!-- only to display label -->
		<input
			data-modal
			value={options?.[selectedIndex]?.label || ''}
			onfocus={async () => {
				listOpen = true;
				await tick();
				input?.focus();
			}}
			{...inputProps}
		/>
	{/if}
</div>
{#if listOpen && filter}
	<div
		class="wrapper"
		bind:this={wrapper}
		in:slide={{ duration: $motion * 1.5, easing: expoOut }}
		out:slide={{ duration: $motion, easing: expoOut }}
	>
		<VirtualList
			width="100%"
			{itemSize}
			{height}
			{itemCount}
			{scrollToIndex}
			{scrollToAlignment}
			{scrollToBehaviour}
			{overscanCount}
		>
			<button
				slot="item"
				let:index
				let:style
				{style}
				onpointerenter={() => {
					highlightedIndex = index;
				}}
				onclick={() => pick(index)}
			>
				{#if rows[index]?.kind === 'header'}
					{@const row = rows[index] as Extract<Row, { kind: 'header' }>}
					<div
						class="item group"
						class:highlighted={index === highlightedIndex}
						style:padding-left="{0.8 + row.depth * 1.1}rem"
						title={row.path}
					>
						<div class="item-icon chevron-group" class:open={row.open}>
							<Icon icon="octicon:chevron-right-12" height="none" />
						</div>
						<div class="label">
							<span class="group-path">{row.name}</span>
						</div>
						<span class="count">{row.count}</span>
					</div>
				{:else if rows[index]?.kind === 'option'}
					{@const option = (rows[index] as Extract<Row, { kind: 'option' }>).option}
					<div
						class="item"
						style:padding-left={grouped ? `${1 + (rows[index] as Extract<Row, { kind: 'option' }>).depth * 1.1 + (option.group ? 0.6 : 0)}rem` : undefined}
						class:highlighted={index === highlightedIndex}
						class:selected={value === option.id}
					>
						{#if option.icon || computeIcons}
							<div class="item-icon">
								{#if option.icon}
									<Icon icon={String(option.icon)} height="none" />
								{:else if computeIcons}
									<ComputeIcon entity_id={option.id} />
								{/if}
							</div>
						{/if}
						<div class="label">
							{option.label}
							{#if option.hint}
								<span class="name">
									{option.hint}
								</span>
							{/if}
						</div>
					</div>
				{/if}
			</button>
		</VirtualList>
	</div>
{/if}

<style>
	.container {
		position: relative;
	}
	.icon {
		display: flex;
		position: absolute;
		height: 3.3rem;
		width: 3.3rem;
		align-items: center;
		padding: 1.05rem;
		margin-top: -1px;
		background: none;
		border: none;
		color: lightgrey;
	}
	.chevron {
		right: 0;
		pointer-events: none;
	}
	.close {
		right: 0;
		cursor: pointer;
	}
	.input {
		padding-right: 3rem !important;
	}
	/* list */
	.wrapper {
		margin-top: 0.2rem;
		position: relative;
		background-color: #1d1b18;
		border-radius: 0.6rem;
		overflow: hidden;
	}
	[slot='item'] {
		all: unset;
	}
	.highlighted {
		background-color: rgba(255, 255, 255, 0.05);
	}
	.selected {
		background-color: rgba(255, 255, 255, 0.1);
	}
	.item {
		display: flex;
		align-items: center;
		padding-left: 1rem;
		cursor: pointer;
		gap: 0.9rem;
		font-size: 0.95rem;
		height: 100%;
	}
	.group {
		background-color: rgba(255, 255, 255, 0.04);
		font-weight: 600;
		padding-right: 1rem;
	}
	.group-path {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.chevron-group {
		transition: transform 150ms ease;
	}
	.chevron-group.open {
		transform: rotate(90deg);
	}
	.count {
		margin-left: auto;
		font-size: 0.8rem;
		opacity: 0.5;
	}
	.item-icon {
		display: flex;
		align-items: center;
		width: 1.28rem;
		height: 1.28rem;
	}
	.label {
		display: grid;
		gap: 0.2rem;
		overflow: hidden;
	}
	.name {
		font-size: 0.8rem;
		opacity: 0.4;
		margin-top: -1px;
	}
</style>
