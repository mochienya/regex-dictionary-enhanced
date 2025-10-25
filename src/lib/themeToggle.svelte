<script lang='ts'>
	import type { ClassValue } from 'svelte/elements'
	import { onMount } from 'svelte'

	const props: { class: ClassValue } = $props()

	let theme = $state('light')

	onMount(() => {
		theme = (() => {
			const localStorageTheme = localStorage?.getItem('theme') ?? ''
			if (['dark', 'light'].includes(localStorageTheme))
				return localStorageTheme
			if (window.matchMedia('(prefers-color-scheme: dark)').matches)
				return 'dark'
			return 'light'
		})()
		if (theme === 'dark')
			document.documentElement.classList.add('dark')
		window.localStorage.setItem('theme', theme)
	})

	function toggleTheme() {
		document.documentElement.classList.toggle('dark')
		theme = document.documentElement.classList.contains('dark') ? 'dark' : 'light'
		localStorage.setItem('theme', theme)
	}
</script>

<button class={`button p-2 flex rounded-full items-center ${props.class ?? ''}`} onclick={toggleTheme} aria-label={`set theme to ${theme === 'light' ? 'dark' : 'light'} mode`}>
	<i class='light:icon-[solar--sun-outline] dark:icon-[solar--moon-outline] text-2xl'></i>
</button>
