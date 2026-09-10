package cat.aulaia.kiosko

import android.os.Handler
import android.os.Looper
import android.util.Log
import java.io.BufferedReader
import java.net.HttpURLConnection
import java.net.URL
import java.util.concurrent.Executors

/**
 * Fetches the playlist and remembers the last good one.
 *
 * Uses HttpURLConnection on a single background thread rather than pulling in
 * an HTTP client: one small GET every few minutes does not justify the
 * dependency, and fewer libraries means fewer things to break on an old
 * WebView-era system image.
 */
class PlaylistRepository(private val prefs: Prefs) {

    private val io = Executors.newSingleThreadExecutor()
    private val main = Handler(Looper.getMainLooper())

    /**
     * @param onResult called on the main thread with the playlist, or null if
     *   the request failed and there was nothing cached.
     */
    fun load(onResult: (Playlist?, error: String?) -> Unit) {
        io.execute {
            var error: String? = null
            val body = try {
                fetch(prefs.playlistUrl)
            } catch (e: Exception) {
                Log.w(TAG, "playlist fetch failed", e)
                error = e.message ?: e.javaClass.simpleName
                null
            }

            // Only overwrite the cache with something we could actually parse,
            // so a half-broken response cannot poison the fallback.
            val playlist = body?.let {
                try {
                    Playlist.parse(it).also { _ -> prefs.cachedPlaylist = it }
                } catch (e: Exception) {
                    Log.w(TAG, "playlist parse failed", e)
                    error = "resposta no vàlida"
                    null
                }
            } ?: prefs.cachedPlaylist?.let {
                try {
                    Playlist.parse(it)
                } catch (e: Exception) {
                    null
                }
            }

            main.post { onResult(playlist, error) }
        }
    }

    private fun fetch(url: String): String {
        val connection = (URL(url).openConnection() as HttpURLConnection).apply {
            requestMethod = "GET"
            connectTimeout = 15_000
            readTimeout = 15_000
            setRequestProperty("Accept", "application/json")
            setRequestProperty("Cache-Control", "no-cache")
        }
        try {
            val code = connection.responseCode
            if (code !in 200..299) {
                throw IllegalStateException("HTTP $code")
            }
            return connection.inputStream.bufferedReader().use(BufferedReader::readText)
        } finally {
            connection.disconnect()
        }
    }

    private companion object {
        const val TAG = "KioskoPlaylist"
    }
}
