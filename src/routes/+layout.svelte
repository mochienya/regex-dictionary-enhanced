<script lang='ts'>
	import favicon from '$lib/assets/favicon.svg'
	import ThemeToggle from '$lib/themeToggle.svelte'
	import '../app.css'

	const { children } = $props()
</script>

<svelte:head>
	<link rel='icon' href={favicon} />
</svelte:head>

<ThemeToggle class='absolute top-0 right-0 rounded-none rounded-bl-xl pr-1.5 pt-1.5' />

{@render children?.()}
