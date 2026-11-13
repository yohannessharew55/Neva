import Foundation
import EventKit
import Capacitor

@objc(RemindersPlugin)
public class RemindersPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "RemindersPlugin"
    public let jsName = "Reminders"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "requestPermissions", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "createReminder", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "syncAllReminders", returnType: CAPPluginReturnPromise)
    ]

    private let eventStore = EKEventStore()

    @objc func requestPermissions(_ call: CAPPluginCall) {
        if #available(iOS 17.0, *) {
            eventStore.requestFullAccessToReminders { (granted, error) in
                if let error = error {
                    call.reject("Permission error: \(error.localizedDescription)")
                    return
                }
                call.resolve(["granted": granted])
            }
        } else {
            eventStore.requestAccess(to: .reminder) { (granted, error) in
                if let error = error {
                    call.reject("Permission error: \(error.localizedDescription)")
                    return
                }
                call.resolve(["granted": granted])
            }
        }
    }

    @objc func createReminder(_ call: CAPPluginCall) {
        guard let title = call.getString("title") else {
            call.reject("Title is required")
            return
        }

        let notes = call.getString("notes") ?? ""
        let dueMinutesFromNow = call.getInt("dueMinutes") ?? 0
        let listName = call.getString("listName") ?? "NEVA Flow"

        // Ensure target calendar/list exists
        var targetCalendar = eventStore.calendars(for: .reminder).first { $0.title == listName }
        if targetCalendar == nil {
            let newCalendar = EKCalendar(for: .reminder, eventStore: eventStore)
            newCalendar.title = listName
            newCalendar.source = eventStore.defaultCalendarForNewReminders()?.source ?? eventStore.sources.first
            do {
                try eventStore.saveCalendar(newCalendar, commit: true)
                targetCalendar = newCalendar
            } catch {
                targetCalendar = eventStore.defaultCalendarForNewReminders()
            }
        }

        let reminder = EKReminder(eventStore: eventStore)
        reminder.title = title
        reminder.notes = notes
        reminder.calendar = targetCalendar ?? eventStore.defaultCalendarForNewReminders()

        if dueMinutesFromNow > 0 {
            let dueDate = Date().addingTimeInterval(TimeInterval(dueMinutesFromNow * 60))
            let calendar = Calendar.current
            let components = calendar.dateComponents([.year, .month, .day, .hour, .minute], from: dueDate)
            reminder.dueDateComponents = components
            
            // Add alarm to ring on iPhone
            let alarm = EKAlarm(absoluteDate: dueDate)
            reminder.addAlarm(alarm)
        }

        do {
            try eventStore.save(reminder, commit: true)
            call.resolve([
                "success": true,
                "reminderId": reminder.calendarItemIdentifier
            ])
        } catch {
            call.reject("Failed to save reminder: \(error.localizedDescription)")
        }
    }

    @objc func syncAllReminders(_ call: CAPPluginCall) {
        guard let items = call.getArray("items", [String: Any].self) else {
            call.reject("Items array is required")
            return
        }

        var savedCount = 0
        let defaultCal = eventStore.defaultCalendarForNewReminders()

        for item in items {
            guard let title = item["title"] as? String else { continue }
            let reminder = EKReminder(eventStore: eventStore)
            reminder.title = title
            reminder.notes = item["notes"] as? String ?? ""
            reminder.calendar = defaultCal

            if let mins = item["dueMinutes"] as? Int, mins > 0 {
                let dueDate = Date().addingTimeInterval(TimeInterval(mins * 60))
                let components = Calendar.current.dateComponents([.year, .month, .day, .hour, .minute], from: dueDate)
                reminder.dueDateComponents = components
                reminder.addAlarm(EKAlarm(absoluteDate: dueDate))
            }

            do {
                try eventStore.save(reminder, commit: false)
                savedCount += 1
            } catch {}
        }

        do {
            try eventStore.commit()
            call.resolve(["savedCount": savedCount, "success": true])
        } catch {
            call.reject("Failed to commit batch reminders: \(error.localizedDescription)")
        }
    }
}
