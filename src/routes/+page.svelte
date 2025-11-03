<script lang='ts'>
	import type { RegexQueryResponse, RequestData, ResponseData, SetWordListResponse, WordList } from '$lib/regexWorker'
	import { browser } from '$app/environment'
	import { wordLists } from '$lib/regexWorker'
	import RegexWorker from '$lib/regexWorker?worker'
	import { onMount } from 'svelte'

	const regexWorker = browser ? new RegexWorker() : undefined
	const messageRegexWorker = (data: RequestData) => regexWorker!.postMessage(data)
	onMount(() => {
		regexWorker!.onmessage = (e) => {
			const response = e.data as ResponseData
			switch (response.type) {
				case 'query': return handleRegexQueryResponse(response)
				case 'setWordList': return handleSetWordListResponse(response)
			}
		}
		selectWordList(wordLists[0])
	})

	let wordList: WordList | undefined = $state()
	function selectWordList(list: WordList) {
		wordList = undefined
		messageRegexWorker({ type: 'setWordList', wordList: list })
	}
	function handleSetWordListResponse(response: SetWordListResponse) {
		wordList = response.wordList
	}

	let regexQuery = $state('')
	const regexError = $derived.by(() => {
		try {
			new RegExp(regexQuery)
		}
		catch (e) { return e as Error }
	})
	let words: string[] = $state([])
	let remainingWords = $state(0)
	$effect(() => {
		if (regexQuery === '' || regexError !== undefined || wordList === undefined) {
			words = []
			remainingWords = 0
			return
		}
		// TODO: debounce
		messageRegexWorker({ type: 'query', regexQuery: $state.snapshot(regexQuery) })
	})
	function handleRegexQueryResponse(response: RegexQueryResponse) {
		words = response.words
		remainingWords = response.remainingWords
	}

	let showSettings = $state(false)
</script>

<svelte:document onclick={() => showSettings = false} />

<div class='flex-row justify-center'>
	<main class='relative flex-col gap-5 max-w-2xl my-10 mx-2 w-full self-center items-center'>
		<div class='flex-row w-full gap-2'>
			<input
				type='text'
				class='bg-indigo-200 dark:bg-indigo-800 p-2 px-4 flex rounded-full w-full text-lg'
				placeholder='regex here'
				bind:value={regexQuery}
			/>

			<button
				class='button p-2 flex justify-center items-center aspect-square rounded-full text-lg'
				aria-label='toggle settings panel'
				onclick={(e) => {
					e.stopPropagation()
					showSettings = !showSettings
				}}
			>
				<i class='icon-[solar--settings-outline] text-2xl'></i>
			</button>
		</div>

		<div class='bg-indigo-200 dark:bg-indigo-800 w-full p-2 rounded-xl flex-col gap-5 items-center'>
			{#if wordList === undefined}
				<div class='flex-col items-center gap-5 my-5'>
					<span class='text-xl'>Loading word list</span>
					<i class='icon-[svg-spinners--pulse-multiple] text-5xl'></i>
				</div>
			{:else if regexQuery === ''}
				<span class='text-xl my-5'>Start typing!</span>
			{:else if regexError !== undefined}
				<div class='flex-col gap-2 my-5 items-center'>
					<span class='text-xl'>Error in regex query!</span>
					<span class='light:text-red-600 dark:text-red-400'>{regexError.message}</span>
				</div>
			{:else}
				<ul class='flex-wrap gap-2 justify-around'>
					{#each words as word, i (i)}
						<li>{word}</li>
					{/each}
				</ul>

				{#if remainingWords > 0}
					<span class='text-xl'>and {remainingWords} more entries</span>
				{/if}
			{/if}
		</div>

		<div
			class={`absolute right-0 top-16 min-w-xs bg-indigo-100/25 dark:bg-indigo-900/25 backdrop-blur-lg p-2 rounded-xl flex-col gap-5 ${showSettings ? 'opacity-100' : 'opacity-0'} transition-opacity ease-in-out`}
			aria-hidden={!showSettings}
		>
			<div class='flex-col gap-2'>
				<h2 class='text-lg'>Word List:</h2>
				{#each wordLists as listName, index (index)}
					<button
						class='button px-2'
						onclick={() => selectWordList(listName)}
						disabled={wordList === undefined || wordList === listName}
					>
						{listName}
					</button>
				{/each}
			</div>

			<div class='flex-col gap-2'>
				<h2 class='text-lg'>Regex Engine:</h2>

				<button class='button px-2' disabled>
					ECMAScript
				</button>
			</div>
		</div>
	</main>
</div>
