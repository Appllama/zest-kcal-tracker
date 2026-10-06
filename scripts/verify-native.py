"""Optional IDB regression: verifies the standalone app with real accessibility/HID input."""

import asyncio, json, sys
from datetime import datetime, timedelta
from pathlib import Path
from device import connect, sim, UDID, APP, QA
from idb.common.hid import _key_up_event


def diary():
    root = Path(sim("get_app_container", UDID, APP, "data").stdout.strip())
    return json.loads((root / "Documents/zest-diary.json").read_text())["state"]


async def main(d):
    report = {}
    sim("terminate", UDID, APP, check=False)
    sim("launch", UDID, APP)
    await d.find("Log a meal")
    labels = [x.get("AXLabel") for x in await d.tree()]
    assert "Back to chat collection" not in labels
    assert len([x for x in labels if x == "Zest, open calorie calendar"]) == 1
    report["standaloneRootHasOneMascotAndNoBack"] = True
    await d.shot("welcome")
    await d.keyboard()
    await d.c.send_events([_key_up_event(k) for k in range(224, 232)])
    sim("terminate", UDID, APP, check=False)
    sim("launch", UDID, APP)
    await d.open("zest-kcal-tracker://?demo=1")
    await d.tap("Log a meal")
    await d.tap("Take a photo", wait=1)
    await d.find("Take dinner photo")
    await d.shot("qa-camera-viewfinder")
    await d.tap("Sample camera viewfinder. Tap to focus on dinner", wait=0.2)
    await d.tap("Take dinner photo", wait=0.4)
    await d.shot("qa-camera-review")
    await d.tap("Retake meal photo", wait=0.3)
    await d.find("Take dinner photo")
    assert len(diary()["meals"]) == 32
    await d.tap("Close sample camera", wait=0.6)
    await d.find("Log a meal")
    assert len(diary()["meals"]) == 32
    report["cameraRetakeAndCancelDoNotLog"] = True
    await d.tap("Log a meal")
    await d.tap("Try a sample meal", wait=0.8)
    await d.tap("Take dinner photo", wait=0.35)
    await d.tap("Use meal photo", wait=1.2)
    await d.find("Log as dinner")
    await d.shot("qa-choices")
    await d.tap("Log as dinner", wait=1)
    assert (
        sum(
            m["kcal"]
            for m in diary()["meals"]
            if m["date"] == datetime.now().strftime("%Y-%m-%d")
        )
        == 2240
    )
    await d.shot("qa-receipt")
    report["sampleMealLoggedExactlyOnce"] = True
    # Native keyboard can leave the previous UIKit AX transform cached after a full-screen modal.
    await d.c.tap(161, 766, 0.12)
    await asyncio.sleep(0.8)
    await d.c.text("how much protein")
    await asyncio.sleep(0.5)
    await d.shot("qa-keyboard")
    await d.tap("Send message", wait=1.2)
    await d.find("70 g protein. Today · estimated. A little fuel for whatever’s next.")
    await asyncio.sleep(
        0.5
    )  # AX is present before the whole-answer fade has completed.
    a = await d.shot("qa-answer")
    answer = next(
        x["frame"]
        for x in a
        if x.get("AXLabel")
        == "70 g protein. Today · estimated. A little fuel for whatever’s next."
    )
    assert answer["y"] + answer["height"] < 700, answer
    report["wholeVisualAnswerVisible"] = True
    await d.tap("Zest, open calorie calendar", wait=0.7)
    today = datetime.now().strftime("%Y-%m-%d")
    await d.tap(f"Today, 2240 kilocalories, {today}")
    await d.tap("Edit Pasta & garlic bread, 1120 kilocalories", wait=0.8)
    await d.tap("Meal calories", wait=0.8)
    await d.c.text("0")
    await asyncio.sleep(0.8)
    await d.tap("Save meal")
    await d.find("Use 1–10,000 kcal.")
    await d.tap("Meal calories", wait=0.8)
    await d.c.text("1180")
    await asyncio.sleep(0.8)
    await d.shot("qa-edit-keyboard")
    await d.tap("Save meal", wait=1)
    await d.find("2300 kilocalories logged")
    report["invalidEditRejectedAndValidEditUpdatesTotal"] = True
    await d.tap("Edit daily calorie guide", wait=1)
    await d.tap("Daily guide calories", wait=0.8)
    await d.c.text("400")
    await asyncio.sleep(0.8)
    await d.tap("Save daily guide", wait=1)
    await d.shot("qa-high-reaction")
    assert diary()["guide"] == 400
    report["guideAndHighReaction"] = True
    await d.tap("Edit daily calorie guide", wait=1)
    await d.tap("Daily guide calories", wait=0.8)
    await d.c.text("2000")
    await asyncio.sleep(0.8)
    await d.tap("Save daily guide", wait=1)
    await d.tap("Previous month")
    previous = (datetime.now().replace(day=1) - timedelta(days=1)).strftime("%B")
    assert any(previous in (x.get("AXLabel") or "") for x in await d.tree())
    await d.shot("qa-previous-month")
    await d.tap("Next month")
    assert any(
        datetime.now().strftime("%B") in (x.get("AXLabel") or "")
        for x in await d.tree()
    )
    report["monthNavigation"] = True
    await d.tap(f"Today, 2300 kilocalories, {today}")
    await d.tap("Edit Pasta & garlic bread, 1180 kilocalories", wait=1)
    await d.tap("Remove this meal", wait=0.6)
    await d.find("1120 kilocalories logged")
    report["deleteUpdatesDiary"] = True
    # SwiftUI's hosted AX frame can retain its offscreen transform after editor dismissal.
    # The visible close control remains at the verified native screen position.
    await d.c.tap(362, 84, 0.12)
    await asyncio.sleep(0.65)
    await d.tap("New Zest conversation")
    await d.tap("Log a meal")
    await d.tap("Photo library", wait=6)
    await d.shot("qa-photo-library")
    # Apple's out-of-process Photos UI does not expose its descendants to idb.
    # This close coordinate is verified against the native sheet screenshot.
    await d.c.tap(38, 100, 0.15)
    await d.find("Log a meal", timeout=10)
    assert len([m for m in diary()["meals"] if m["date"] == today]) == 2
    report["nativePhotoPickerCancelDoesNotLogMeal"] = True
    # Native relaunch keeps the diary and guide; no demo query on this launch.
    before = diary()
    sim("terminate", UDID, APP)
    sim("launch", UDID, APP)
    await d.open("zest-kcal-tracker://")
    await d.find("Log a meal")
    assert diary() == before
    report["localPersistenceAcrossRelaunch"] = True
    await d.tap("Zest, open calorie calendar", wait=0.7)
    await d.shot("qa-earlier-meals-calendar")
    # SwiftUI's hosted AX frame can retain its offscreen transform after editor dismissal.
    # The visible close control remains at the verified native screen position.
    await d.c.tap(362, 84, 0.12)
    await asyncio.sleep(0.65)
    (QA / "native-results.json").write_text(json.dumps(report, indent=2))
    print(json.dumps(report, indent=2))


asyncio.run(connect(main))
