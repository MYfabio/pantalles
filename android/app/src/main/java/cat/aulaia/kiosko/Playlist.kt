package cat.aulaia.kiosko

import org.json.JSONObject

/**
 * One thing to show, and for how long.
 */
data class PlaylistItem(
    val label: String,
    val url: String,
    val seconds: Int,
)

/**
 * What the server says this screen should be showing.
 *
 * @param active false when the screen is disabled in Kiosko; the player then
 *   shows a black screen rather than stale content.
 * @param reloadSeconds how often to ask the server again.
 */
data class Playlist(
    val screen: String,
    val name: String,
    val active: Boolean,
    val reloadSeconds: Int,
    val items: List<PlaylistItem>,
) {
    companion object {
        /** Fall back to a sane cadence if the server omits or lowballs it. */
        private const val MIN_RELOAD_SECONDS = 30
        private const val MIN_ITEM_SECONDS = 5

        fun parse(json: String): Playlist {
            val root = JSONObject(json)
            val itemsJson = root.optJSONArray("items")
            val items = buildList {
                for (i in 0 until (itemsJson?.length() ?: 0)) {
                    val o = itemsJson!!.getJSONObject(i)
                    val url = o.optString("url").trim()
                    if (url.isEmpty()) continue
                    add(
                        PlaylistItem(
                            label = o.optString("label", ""),
                            url = url,
                            seconds = o.optInt("seconds", 30).coerceAtLeast(MIN_ITEM_SECONDS),
                        )
                    )
                }
            }
            return Playlist(
                screen = root.optString("screen"),
                name = root.optString("name"),
                active = root.optBoolean("active", true),
                reloadSeconds = root.optInt("reloadSeconds", 300)
                    .coerceAtLeast(MIN_RELOAD_SECONDS),
                items = items,
            )
        }
    }
}
