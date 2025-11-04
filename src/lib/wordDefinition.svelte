<script lang='ts'>
	import { PUBLIC_DICTIONARY_API_KEY } from '$env/static/public'

	let { word = $bindable(), y }: { word: string | undefined, y: number } = $props()

	async function getDefinitions(word: string | undefined): Promise<string[]> {
		if (word === undefined)
			return []
		const data = await fetch(`https://www.dictionaryapi.com/api/v3/references/collegiate/json/${word}?key=${PUBLIC_DICTIONARY_API_KEY}`)
			.then(r => r.json())
			.catch(() => ([{ shortdef: [] }]))
		if (!Object.hasOwn(data?.[0], 'shortdef'))
			return []
		return data[0].shortdef
	}
</script>

{#if word !== undefined}
	<div class='fixed inset-0 bg-black/10' aria-hidden='true'>
	</div>
{/if}

<dialog
	class='absolute left-1/2 -translate-1/2 float w-xs max-w-screen'
	style={`top:${y}px`}
	open={word !== undefined}
	closedby='any'
	onclose={() => word = undefined}
>
	<div class='flex-row justify-between'>
		<h2 class='text-2xl'>{word}</h2>
		<button class='button flex items-center px-1' aria-label='close definition' onclick={() => word = undefined}>
			<i class='icon-[material-symbols--close-rounded] text-2xl'></i>
		</button>
	</div>
	{#await getDefinitions(word)}
		<div class='ml-4 flex-col gap-2'>
			<div class='skeletonText w-3/4'></div>
			<div class='skeletonText w-full'></div>
			<div class='skeletonText w-1/2'></div>
		</div>
	{:then definitions}
		{#if definitions.length === 0}
			<p>
				no definitions found for {word}
			</p>
		{:else}
			<ol class='list-decimal ml-8'>
				{#each definitions as definition, i (i)}
					<li>{definition}</li>
				{/each}
			</ol>
		{/if}
	{/await}
</dialog>
