export const wordLists = ['general', 'scrabble (CSW24)'] as const
export type WordList = typeof wordLists[number]
let wordList: string[] = []

const maxDisplayedWords = 250

interface RegexQueryRequest { type: 'query', regexQuery: string }
interface SetWordListRequest { type: 'setWordList', wordList: WordList }
export type RequestData = RegexQueryRequest | SetWordListRequest

export interface RegexQueryResponse { type: 'query', words: string[], remainingWords: number }
export interface SetWordListResponse { type: 'setWordList', wordList: WordList }
export type ResponseData = RegexQueryResponse | SetWordListResponse
const respond = (data: ResponseData) => postMessage(data)

if (globalThis.Worker) {
	onmessage = (e: { data: RequestData }) => {
		switch (e.data.type) {
			case 'query':
				return handleQuery(e.data)
			case 'setWordList':
				return setWordList(e.data)
			default:
				break
		}
	}

	async function setWordList(data: SetWordListRequest) {
		// TODO: use vite imports?
		wordList = await fetch(`/wordLists/${data.wordList}.txt`)
			.then<string>(r => r.text())
			.then<string[]>(t => t.split(/\r?\n/).map(s => s.toLowerCase()))
		respond(data)
	}

	function handleQuery(data: RegexQueryRequest) {
		const regex = new RegExp(data.regexQuery)
		const wordsUnlimited = wordList.filter(w => regex.test(w))
		const words = wordsUnlimited.slice(0, maxDisplayedWords)
		postMessage({
			type: 'query',
			words,
			remainingWords: wordsUnlimited.length - words.length,
		})
	}
}
