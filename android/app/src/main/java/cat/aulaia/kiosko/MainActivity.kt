package cat.aulaia.kiosko

import android.app.admin.DevicePolicyManager
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.os.SystemClock
import android.view.View
import android.view.WindowManager
import android.webkit.WebResourceError
import android.webkit.WebResourceRequest
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.appcompat.app.AppCompatActivity
import cat.aulaia.kiosko.databinding.ActivityMainBinding

/**
 * The screen itself: a full-bleed WebView that walks the playlist.
 *
 * Everything it knows comes from the server, so the only local state is which
 * item is currently up. Two independent timers run: one advances the rotation,
 * the other re-reads the playlist so changes made in the browser reach the
 * panel without anyone touching it.
 */
class MainActivity : AppCompatActivity() {

    private lateinit var binding: ActivityMainBinding
    private lateinit var prefs: Prefs
    private lateinit var repository: PlaylistRepository

    private val handler = Handler(Looper.getMainLooper())

    private var playlist: Playlist? = null
    private var index = 0
    private var paused = false

    /** Consecutive load failures, used to back off instead of hammering. */
    private var failures = 0

    private var settingsTaps = 0
    private var firstTapAt = 0L

    private val advance = Runnable { showNext() }
    private val refresh = object : Runnable {
        override fun run() {
            loadPlaylist()
            // Rescheduled by loadPlaylist once we know the server's cadence.
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        prefs = Prefs(this)
        repository = PlaylistRepository(prefs)

        // A panel that goes to sleep is a black rectangle in a corridor.
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
        goFullscreen()
        configureWebView()

        // Five taps in the top-left corner opens settings. Deliberately
        // awkward: it must not happen by accident, and there is no visible
        // control for a passer-by to find.
        binding.settingsTarget.setOnClickListener { onSecretTap() }

        binding.retryButton.setOnClickListener {
            failures = 0
            loadPlaylist()
        }
        binding.settingsButton.setOnClickListener { openSettings() }
    }

    override fun onStart() {
        super.onStart()
        if (!prefs.isConfigured) {
            openSettings()
            return
        }
        maybeStartLockTask()
        loadPlaylist()
    }

    override fun onResume() {
        super.onResume()
        goFullscreen()
    }

    override fun onStop() {
        super.onStop()
        handler.removeCallbacks(advance)
        handler.removeCallbacks(refresh)
    }

    override fun onDestroy() {
        handler.removeCallbacksAndMessages(null)
        binding.webView.destroy()
        super.onDestroy()
    }

    /** Back must not drop the viewer onto the launcher. */
    override fun onBackPressed() {
        // Intentionally empty.
    }

    // ---------------------------------------------------------------- webview

    private fun configureWebView() = with(binding.webView.settings) {
        javaScriptEnabled = true
        domStorageEnabled = true
        loadWithOverviewMode = true
        useWideViewPort = true
        // Signage content is mostly video and animation; requiring a gesture
        // would mean it never starts, because nobody touches these screens.
        mediaPlaybackRequiresUserGesture = false
        cacheMode = WebSettings.LOAD_DEFAULT
        binding.webView.setBackgroundColor(0xFF000000.toInt())
        binding.webView.keepScreenOn = true
        binding.webView.isVerticalScrollBarEnabled = false
        binding.webView.isHorizontalScrollBarEnabled = false

        binding.webView.webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(
                view: WebView?,
                request: WebResourceRequest?,
            ): Boolean = false

            override fun onPageFinished(view: WebView?, url: String?) {
                failures = 0
                binding.errorPanel.visibility = View.GONE
            }

            override fun onReceivedError(
                view: WebView?,
                request: WebResourceRequest?,
                error: WebResourceError?,
            ) {
                // Sub-resources fail all the time and do not matter; only a
                // failure of the page itself is worth reacting to.
                if (request?.isForMainFrame != true) return
                onLoadFailure()
            }
        }
    }

    // --------------------------------------------------------------- playlist

    private fun loadPlaylist() {
        repository.load { result, error ->
            handler.removeCallbacks(refresh)

            if (result == null) {
                showError(getString(R.string.error_no_playlist, error ?: "-"))
                scheduleRetry()
                return@load
            }

            playlist = result

            if (!result.active || result.items.isEmpty()) {
                // A disabled or empty screen shows black, not stale content.
                binding.webView.loadUrl("about:blank")
                showError(getString(R.string.error_screen_inactive))
            } else {
                if (index >= result.items.size) index = 0
                binding.errorPanel.visibility = View.GONE
                showCurrent()
            }

            handler.postDelayed(refresh, result.reloadSeconds * 1000L)
        }
    }

    private fun showCurrent() {
        val items = playlist?.items.orEmpty()
        if (items.isEmpty()) return
        val item = items[index % items.size]

        binding.webView.loadUrl(item.url)

        handler.removeCallbacks(advance)
        // A single-item playlist still reloads on its own timer, which is what
        // keeps a server-rendered panel from going stale on screen.
        if (!paused) {
            handler.postDelayed(advance, item.seconds * 1000L)
        }
    }

    private fun showNext() {
        val items = playlist?.items.orEmpty()
        if (items.isEmpty()) return
        index = (index + 1) % items.size
        showCurrent()
    }

    // ------------------------------------------------------------------ error

    private fun onLoadFailure() {
        failures++
        val items = playlist?.items.orEmpty()
        if (items.size > 1) {
            // Skip past a URL that is down rather than sitting on it.
            handler.removeCallbacks(advance)
            handler.postDelayed(advance, RETRY_BASE_MS)
        } else {
            scheduleRetry()
        }
    }

    /** Back off up to a minute so a long outage does not spin the radio. */
    private fun scheduleRetry() {
        val delay = (RETRY_BASE_MS * (1 shl failures.coerceAtMost(4)))
            .coerceAtMost(MAX_RETRY_MS)
        handler.removeCallbacks(refresh)
        handler.postDelayed(refresh, delay)
    }

    private fun showError(message: String) {
        binding.errorText.text = message
        binding.errorPanel.visibility = View.VISIBLE
    }

    // --------------------------------------------------------------- settings

    private fun onSecretTap() {
        val now = SystemClock.elapsedRealtime()
        if (now - firstTapAt > TAP_WINDOW_MS) {
            firstTapAt = now
            settingsTaps = 0
        }
        settingsTaps++
        if (settingsTaps >= TAPS_TO_OPEN) {
            settingsTaps = 0
            openSettings()
        }
    }

    private fun openSettings() {
        stopLockTaskSafely()
        startActivity(Intent(this, SettingsActivity::class.java))
    }

    // ------------------------------------------------------------- kiosk mode

    /**
     * Pins the app so the home and recents buttons cannot leave it.
     *
     * Only silent when this app is the device owner, which needs one-time
     * provisioning over ADB. Without it Android would ask the viewer to
     * confirm, which on an unattended panel means it never gets confirmed, so
     * we simply skip it.
     */
    private fun maybeStartLockTask() {
        if (!prefs.kioskMode) return
        val dpm = getSystemService(Context.DEVICE_POLICY_SERVICE) as DevicePolicyManager
        if (!dpm.isDeviceOwnerApp(packageName)) return
        try {
            dpm.setLockTaskPackages(
                android.content.ComponentName(this, KioskoDeviceAdmin::class.java),
                arrayOf(packageName),
            )
            startLockTask()
        } catch (e: Exception) {
            // Not fatal: the panel still works, it is just not pinned.
        }
    }

    private fun stopLockTaskSafely() {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) stopLockTask()
        } catch (e: Exception) {
            // Was not pinned.
        }
    }

    // ------------------------------------------------------------- fullscreen

    private fun goFullscreen() {
        @Suppress("DEPRECATION")
        window.decorView.systemUiVisibility = (
            View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                or View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                or View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                or View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                or View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                or View.SYSTEM_UI_FLAG_FULLSCREEN
            )
    }

    private companion object {
        const val RETRY_BASE_MS = 5_000L
        const val MAX_RETRY_MS = 60_000L
        const val TAP_WINDOW_MS = 4_000L
        const val TAPS_TO_OPEN = 5
    }
}
