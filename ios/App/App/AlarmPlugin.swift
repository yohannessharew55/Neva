import Foundation
import UserNotifications
import AudioToolbox
import Capacitor

@objc(AlarmPlugin)
public class AlarmPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "AlarmPlugin"
    public let jsName = "Alarm"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "requestAlarmPermissions", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "scheduleFocusAlarm", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "cancelAlarm", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "triggerImmediateAlarm", returnType: CAPPluginReturnPromise)
    ]

    @objc func requestAlarmPermissions(_ call: CAPPluginCall) {
        let center = UNUserNotificationCenter.current()
        let options: UNAuthorizationOptions = [.alert, .sound, .badge, .criticalAlert]

        center.requestAuthorization(options: options) { (granted, error) in
            if let error = error {
                call.reject("Permission failed: \(error.localizedDescription)")
                return
            }
            call.resolve(["granted": granted])
        }
    }

    @objc func scheduleFocusAlarm(_ call: CAPPluginCall) {
        guard let id = call.getString("id") else {
            call.reject("Alarm ID is required")
            return
        }

        let title = call.getString("title") ?? "Focus Session Finished!"
        let body = call.getString("body") ?? "Your deep work block has completed. Take a mindful breath."
        let seconds = call.getDouble("seconds") ?? 60.0
        let soundType = call.getString("sound") ?? "tibetan"

        let content = UNMutableNotificationContent()
        content.title = title
        content.body = body
        content.categoryIdentifier = "FOCUS_ALARM"

        // Time-sensitive interruption level (iOS 15 / 16+)
        if #available(iOS 15.0, *) {
            content.interruptionLevel = .timeSensitive
        }

        // Set system alarm sound
        if soundType == "digital" {
            content.sound = UNNotificationSound.default
        } else {
            content.sound = UNNotificationSound.defaultCritical
        }

        let trigger = UNTimeIntervalNotificationTrigger(timeInterval: max(1.0, seconds), repeats: false)
        let request = UNNotificationRequest(identifier: id, content: content, trigger: trigger)

        UNUserNotificationCenter.current().add(request) { (error) in
            if let error = error {
                call.reject("Error scheduling alarm: \(error.localizedDescription)")
                return
            }
            call.resolve([
                "success": true,
                "id": id,
                "firesInSeconds": seconds
            ])
        }
    }

    @objc func cancelAlarm(_ call: CAPPluginCall) {
        guard let id = call.getString("id") else {
            call.reject("Alarm ID required")
            return
        }
        UNUserNotificationCenter.current().removePendingNotificationRequests(withIdentifiers: [id])
        call.resolve(["success": true])
    }

    @objc func triggerImmediateAlarm(_ call: CAPPluginCall) {
        // Trigger haptic vibration + system alert sound
        AudioServicesPlayAlertSound(SystemSoundID(1005)) // Bell chime
        AudioServicesPlaySystemSound(kSystemSoundID_Vibrate)
        call.resolve(["success": true])
    }
}
