package emotes

import (
	"breakfast/services/events/types"
	"strings"
)

func EmotifyFragments(provider string, providerId string, fragments []types.ChatMessageFragment) []types.ChatMessageFragment {
	emotifiedFragments := fragments

	if stvGlobals != nil {
		working := make([]types.ChatMessageFragment, 0)

		for _, fragment := range emotifiedFragments {
			if fragment.Type != "text" {
				working = append(working, fragment)
				continue
			}

			text := ""
			words := strings.Split(fragment.Text, " ")
			wordsLength := len(words)
		STVGlobalWord:
			for wordIdx, word := range words {
				for _, emote := range stvGlobals.Emotes {
					if emote.Data.Name == word {
						if text != "" {
							working = append(working, types.ChatMessageFragment{
								Type:   "text",
								Text:   text,
								Images: []types.ChatMessageImage{},
							})

							text = ""
							if wordIdx != wordsLength-1 {
								text += " "
							}
						}

						images := make([]types.ChatMessageImage, 0)
						for _, file := range emote.Data.Host.Files {
							images = append(images, types.ChatMessageImage{
								Url: emote.Data.Host.Url + "/" + file.Name,
							})
						}
						working = append(working, types.ChatMessageFragment{
							Type:   "emote",
							Text:   word,
							Images: images,
						})
						continue STVGlobalWord
					}
				}

				text += word
				if wordIdx != wordsLength-1 {
					text += " "
				}
			}

			if text != "" {
				working = append(working, types.ChatMessageFragment{
					Type: "text",
					Text: text,
				})
			}
		}

		emotifiedFragments = working
	}

	if stvConnection, exists := stvConnections[provider+"-"+providerId]; exists {
		working := make([]types.ChatMessageFragment, 0)

		for _, fragment := range emotifiedFragments {
			if fragment.Type != "text" {
				working = append(working, fragment)
				continue
			}

			text := ""
			words := strings.Split(fragment.Text, " ")
			wordsLength := len(words)
		STVSetWord:
			for wordIdx, word := range words {
				for _, emote := range stvConnection.EmoteSet.Emotes {
					if emote.Data.Name == word {
						if text != "" {
							working = append(working, types.ChatMessageFragment{
								Type:   "text",
								Text:   text,
								Images: []types.ChatMessageImage{},
							})

							text = ""
							if wordIdx != wordsLength-1 {
								text += " "
							}
						}

						images := make([]types.ChatMessageImage, 0)
						for _, file := range emote.Data.Host.Files {
							images = append(images, types.ChatMessageImage{
								Url: emote.Data.Host.Url + "/" + file.Name,
							})
						}
						working = append(working, types.ChatMessageFragment{
							Type:   "emote",
							Text:   word,
							Images: images,
						})
						continue STVSetWord
					}
				}

				text += word
				if wordIdx != wordsLength-1 {
					text += " "
				}
			}

			if text != "" {
				working = append(working, types.ChatMessageFragment{
					Type: "text",
					Text: text,
				})
			}
		}

		emotifiedFragments = working
	}

	return emotifiedFragments
}
