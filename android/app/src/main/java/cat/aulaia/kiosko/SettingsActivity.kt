package cat.aulaia.kiosko

import android.content.Intent
import android.os.Bundle
import android.view.View
import androidx.appcompat.app.AppCompatActivity
import cat.aulaia.kiosko.databinding.ActivitySettingsBinding

/**
 * The only screen anyone configures, and it asks for as little as possible:
 * which Kiosko install, and which screen this device is.
 *
 * The rotation itself — what to show, in what order, for how long — is managed
 * from the web, so it deliberately does not appear here. Putting it on the
 * device would mean walking up to every panel to change anything.
 */
class SettingsActivity : AppCompatActivity() {

    private lateinit var binding: ActivitySettingsBinding
    private lateinit var prefs: Prefs

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivitySettingsBinding.inflate(layoutInflater)
        setContentView(binding.root)

        prefs = Prefs(this)
        binding.baseUrlInput.setText(prefs.baseUrl)
        binding.slugInput.setText(prefs.slug)
        binding.kioskSwitch.isChecked = prefs.kioskMode

        binding.testButton.setOnClickListener { test() }
        binding.saveButton.setOnClickListener { save() }
    }

    private fun readInputs(): Pair<String, String> {
        val base = binding.baseUrlInput.text.toString().trim().trimEnd('/')
        val slug = binding.slugInput.text.toString().trim()
        return base to slug
    }

    /** Checks the address before committing, so mistakes surface here. */
    private fun test() {
        val (base, slug) = readInputs()
        if (base.isEmpty() || slug.isEmpty()) {
            showStatus(getString(R.string.settings_missing), false)
            return
        }

        // Test against what was typed, not what is stored.
        val previousBase = prefs.baseUrl
        val previousSlug = prefs.slug
        prefs.baseUrl = base
        prefs.slug = slug

        showStatus(getString(R.string.settings_testing), true)
        PlaylistRepository(prefs).load { playlist, error ->
            if (playlist == null) {
                prefs.baseUrl = previousBase
                prefs.slug = previousSlug
                showStatus(getString(R.string.settings_test_failed, error ?: "-"), false)
            } else {
                showStatus(
                    getString(
                        R.string.settings_test_ok,
                        playlist.name.ifEmpty { playlist.screen },
                        playlist.items.size,
                    ),
                    true,
                )
            }
        }
    }

    private fun save() {
        val (base, slug) = readInputs()
        if (base.isEmpty() || slug.isEmpty()) {
            showStatus(getString(R.string.settings_missing), false)
            return
        }
        prefs.baseUrl = base
        prefs.slug = slug
        prefs.kioskMode = binding.kioskSwitch.isChecked

        startActivity(
            Intent(this, MainActivity::class.java)
                .addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP)
        )
        finish()
    }

    private fun showStatus(message: String, ok: Boolean) {
        binding.statusText.text = message
        binding.statusText.visibility = View.VISIBLE
        binding.statusText.setTextColor(
            getColor(if (ok) R.color.kiosko_navy else R.color.kiosko_error)
        )
    }
}
