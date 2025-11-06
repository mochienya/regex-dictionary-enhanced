<script lang='ts'>
	import type { RegexQueryResponse, RequestData, ResponseData, SetWordListResponse, WordList } from '$lib/regexWorker'
	import { browser } from '$app/environment'
	import { goto } from '$app/navigation'
	import { page } from '$app/state'
	import { wordLists } from '$lib/regexWorker'
	import RegexWorker from '$lib/regexWorker?worker'
	import WordDefinition from '$lib/wordDefinition.svelte'
	import lodash from 'lodash'
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

	let regexQuery = $state(page.url.searchParams.get('q') ?? '')
	const updateQueryParamDebounced = lodash.debounce((regexQuery) => {
		const newUrl = page.url
		newUrl.searchParams.set('q', regexQuery)
		goto(newUrl.search, { replaceState: true, noScroll: true, keepFocus: true })
	})
	$effect(() => updateQueryParamDebounced(regexQuery))
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
		messageRegexWorker({ type: 'query', regexQuery: $state.snapshot(regexQuery) })
	})
	function handleRegexQueryResponse(response: RegexQueryResponse) {
		words = response.words
		remainingWords = response.remainingWords
	}

	let showSettings = $state(false)
	let wordToDefine: undefined | string = $state()
	let wordDefinitionY: number = $state(500)
</script>

<div class='flex-row justify-center'>
	<main class='relative flex-col gap-5 max-w-2xl my-10 mx-2 w-full self-center items-center'>
		<div class='flex-row w-full gap-2'>
			<div class='flex-row bg-app-2 p-2 px-4 w-full rounded-full text-lg'>
				<span class='text-indigo-700 dark:text-indigo-300'>/</span>
				<input
					type='text'
					class='grow focus:ring-0 focus:ring-offset-0 focus:outline-none focus:bg-app-1 px-1 rounded-xl'
					placeholder='regex here'
					bind:value={regexQuery}
				/>
				<span class='text-indigo-700 dark:text-indigo-300'>/gi</span>
			</div>

			<button
				class='button p-2 flex justify-center items-center aspect-square rounded-full text-lg'
				aria-label='toggle settings panel'
				onclick={() => showSettings = !showSettings}
			>
				<i class='icon-[solar--settings-outline] text-2xl'></i>
			</button>
		</div>

		<div class='bg-app-2 w-full p-2 rounded-xl flex-col gap-5 items-center'>
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
				<ul class='flex-wrap justify-around'>
					{#each words as word, i (i)}
						<li class='contents'>
							<button class='p-1 cursor-pointer' onclick={(e) => {
								e.stopPropagation()
								const t = e.target as HTMLButtonElement
								wordDefinitionY = t.offsetTop + t.clientHeight * 1.75
								wordToDefine = word
							}}>
								{word}
							</button>
						</li>
					{/each}
				</ul>

				{#if remainingWords > 0}
					<span class='text-xl'>and {remainingWords} more entries</span>
				{/if}
			{/if}
		</div>

		<dialog
			class='absolute ml-auto top-16 min-w-xs float'
			open={showSettings}
			closedby='any'
			onclose={() => showSettings = false}
		>
			<div class='flex-col gap5'>
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
		</dialog>
	</main>
</div>

<WordDefinition bind:word={wordToDefine} y={wordDefinitionY} />
