package cat.aulaia.kiosko

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

/**
 * Starts the panel again after a power cut.
 *
 * Note for whoever installs this: Android only delivers BOOT_COMPLETED to apps
 * that have been launched manually at least once since installation, so open
 * Kiosko once by hand after installing it or this will never fire.
 */
class BootReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        val action = intent.action ?: return
        if (action != Intent.ACTION_BOOT_COMPLETED &&
            action != Intent.ACTION_LOCKED_BOOT_COMPLETED &&
            action != "android.intent.action.QUICKBOOT_POWERON"
        ) return

        if (!Prefs(context).isConfigured) return

        context.startActivity(
            Intent(context, MainActivity::class.java)
                .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        )
    }
}
