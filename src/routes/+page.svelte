<script lang='ts'>
	import { onMount } from 'svelte'

	const wordLists = ['general', 'scrabble (CSW24)']
	let wordListIndex = $state(0)
	let wordList: string[] = $state([])

	let regexQuery = $state('')
	const regex = $derived((() => {
		try {
			return new RegExp(regexQuery)
		}
		catch (e) { return e as Error }
	})())

	const results = $derived((() => {
		if (regexQuery === '')
			return []
		if (Error.isError(regex))
			return []
		return wordList.filter(w => regex.test(w))
	})())

	let showSettings = $state(false)

	async function selectWordList(index: number) {
		wordListIndex = index
		wordList = []
		wordList = await fetch(`/wordLists/${wordLists[index]}.txt`)
			.then<string>(r => r.text())
			.then<string[]>(t => t.split(/\r?\n/).map(s => s.toLowerCase()))
	}

	onMount(() => {
		selectWordList(0)
	})
</script>

<div class='flex-row py-10 px-2 gap-5 justify-center'>
	<main class='flex-col gap-5 max-w-2xl w-full self-center items-center'>
		<div class='flex-row gap-5'>
			<input
				type='text'
				class='bg-indigo-200 dark:bg-indigo-800 p-2 px-4 flex rounded-full w-sm text-lg'
				placeholder='regex here'
				bind:value={regexQuery}
			/>

			<button
				class='button p-2 flex justify-center items-center aspect-square rounded-full text-lg'
				aria-label='toggle settings panel'
				onclick={() => showSettings = !showSettings}
			>
				<i class='icon-[solar--settings-outline] text-2xl'></i>
			</button>
		</div>

		<div class='bg-indigo-200 dark:bg-indigo-800 w-full p-2 rounded-xl flex-col gap-5 items-center'>
			{#if wordList.length === 0}
				<div class='flex-col items-center gap-5 my-5'>
					<span class='text-xl'>Loading {wordLists[wordListIndex]} word list</span>
					<i class='icon-[svg-spinners--pulse-multiple] text-5xl'></i>
				</div>
			{:else if regexQuery === ''}
				<span class='text-xl my-5'>Start typing!</span>
			{:else if Error.isError(regex)}
				<div class='flex-col gap-2 my-5 items-center'>
					<span class='text-xl'>Error in regex query!</span>
					<span class='light:text-red-600 dark:text-red-400'>{regex.message}</span>
				</div>
			{:else}
				<ul class='flex-wrap gap-2 justify-around'>
					{#each results.slice(0, 500) as result, index (index)}
						<li>{result}</li>
					{/each}
				</ul>

				{#if results.length > 500}
					<span class='text-xl'>and {results.length - 500} more entries</span>
				{/if}
			{/if}
		</div>
	</main>

	{#if showSettings}
		<div class='flex-col gap-5'>
			<div class='flex-col gap-2'>
				<h2 class='text-lg'>Word List:</h2>
				{#each wordLists as listName, index (index)}
					<button
						class='button px-2'
						onclick={() => selectWordList(index)}
						disabled={index === wordListIndex}
					>
						{listName}
					</button>
				{/each}
			</div>

			<div class='flex-col gap-2'>
				<h2 class='text-lg'>Regex Engine:</h2>

				<button class="button px-2" disabled>
					ECMAScript
				</button>
			</div>
		</div>
	{/if}
</div>
