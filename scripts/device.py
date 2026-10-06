"""Native Zest simulator driver; all coordinates are in device points."""

import asyncio, json, logging, subprocess, os
from pathlib import Path
from idb.grpc.client import Client
from idb.common.types import TCPAddress
from idb.grpc.idb_pb2 import SettingRequest

UDID = os.environ.get("SIMULATOR_UDID", "")
if not UDID:
    raise RuntimeError("Set SIMULATOR_UDID to the dedicated booted device")
PORT = int(os.environ.get("IDB_PORT", "11021"))
APP = "io.appllama.zestkcaltracker"
ROOT = Path(__file__).resolve().parents[1]
QA = ROOT / ".qa/native"
QA.mkdir(parents=True, exist_ok=True)


def sim(*args, check=True):
    return subprocess.run(
        ["xcrun", "simctl", *args], check=check, text=True, capture_output=True
    )


class Device:
    def __init__(self, client):
        self.c = client

    async def tree(self):
        rows = json.loads((await self.c.accessibility_info(None, True)).json)

        def flatten(items):
            result = []
            for row in items:
                result.append(row)
                result.extend(flatten(row.get("children", [])))
            return result

        return flatten(rows)

    async def find(self, label, timeout=6):
        end = asyncio.get_running_loop().time() + timeout
        while asyncio.get_running_loop().time() < end:
            rows = [
                x
                for x in await self.tree()
                if x.get("AXLabel") == label
                or (
                    label == "Message Zest"
                    and x.get("type") == "TextArea"
                    and (x.get("AXLabel") or "").startswith(label)
                )
            ]
            if rows:
                return rows[-1]
            await asyncio.sleep(0.1)
        raise AssertionError(label)

    async def tap(self, label, hold=0.1, wait=0.35):
        f = (await self.find(label))["frame"]
        await self.c.tap(f["x"] + f["width"] / 2, f["y"] + f["height"] / 2, hold)
        await asyncio.sleep(wait)

    async def shot(self, name):
        sim("io", UDID, "screenshot", str(QA / (name + ".png")))
        a = await self.tree()
        (QA / (name + ".json")).write_text(json.dumps(a, indent=2))
        return a

    async def open(self, url):
        sim("openurl", UDID, url)
        try:
            await self.find("Open", timeout=1)
            await self.tap("Open", wait=0.5)
        except AssertionError:
            pass

    async def keyboard(self, visible=True):
        await self.c.stub.setting(
            SettingRequest(
                hardwareKeyboard=SettingRequest.HardwareKeyboard(enabled=not visible)
            )
        )


async def connect(task):
    async with Client.build(
        TCPAddress("127.0.0.1", PORT), logging.getLogger("zest")
    ) as c:
        assert c.companion.udid == UDID
        await task(Device(c))
