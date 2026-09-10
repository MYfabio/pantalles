package cat.aulaia.kiosko

import android.content.Context

/**
 * Everything this device stores locally.
 *
 * Deliberately tiny: the rotation list lives on the server, so all a panel
 * needs to know is which server and which screen it is. SharedPreferences is
 * enough for that — a database here would be ceremony around four strings.
 */
class Prefs(context: Context) {

    private val sp = context.getSharedPreferences("kiosko", Context.MODE_PRIVATE)

    /** Base URL of the Kiosko install, without a trailing slash. */
    var baseUrl: String
        get() = sp.getString(KEY_BASE_URL, DEFAULT_BASE_URL).orEmpty()
        set(value) = sp.edit().putString(KEY_BASE_URL, value.trim().trimEnd('/')).apply()

    /** Screen slug, e.g. "taller". */
    var slug: String
        get() = sp.getString(KEY_SLUG, "").orEmpty()
        set(value) = sp.edit().putString(KEY_SLUG, value.trim()).apply()

    /**
     * Last playlist that loaded successfully, kept so a panel that boots
     * without network still shows yesterday's content instead of an error.
     */
    var cachedPlaylist: String?
        get() = sp.getString(KEY_CACHE, null)
        set(value) = sp.edit().putString(KEY_CACHE, value).apply()

    /** Whether to pin the app on screen when it is the device owner. */
    var kioskMode: Boolean
        get() = sp.getBoolean(KEY_KIOSK, true)
        set(value) = sp.edit().putBoolean(KEY_KIOSK, value).apply()

    val isConfigured: Boolean
        get() = baseUrl.isNotEmpty() && slug.isNotEmpty()

    /** The endpoint this device polls. */
    val playlistUrl: String
        get() = "$baseUrl/api/playlist/$slug"

    private companion object {
        const val KEY_BASE_URL = "base_url"
        const val KEY_SLUG = "slug"
        const val KEY_CACHE = "cached_playlist"
        const val KEY_KIOSK = "kiosk_mode"
        const val DEFAULT_BASE_URL = "https://kiosko.aulaia.cat"
    }
}
