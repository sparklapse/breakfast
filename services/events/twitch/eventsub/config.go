package eventsub

// Twitch's limit is 300 but we'll leave head room for potential weirdness
const max_listeners_per_pool = 200
const event_sub_url = "wss://eventsub.wss.twitch.tv/ws"
const subscriptions_url = "https://api.twitch.tv/helix/eventsub/subscriptions"
