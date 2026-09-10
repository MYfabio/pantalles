package cat.aulaia.kiosko

import android.app.admin.DeviceAdminReceiver

/**
 * Exists so the app can be provisioned as device owner, which is what allows
 * true kiosk pinning without a confirmation dialog nobody is there to accept.
 *
 * Provisioning is a one-off, on a freshly reset device with no accounts:
 *
 *   adb shell dpm set-device-owner cat.aulaia.kiosko/.KioskoDeviceAdmin
 *
 * Skipping this is fine — the app just runs unpinned.
 */
class KioskoDeviceAdmin : DeviceAdminReceiver()
