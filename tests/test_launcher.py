from __future__ import annotations

import os
import unittest
from unittest.mock import MagicMock, patch

import serve


class MoonrailLauncherTests(unittest.TestCase):
    @patch("serve.urllib.request.urlopen")
    def test_moonrail_url_recognizes_the_game(self, urlopen: MagicMock) -> None:
        response = urlopen.return_value.__enter__.return_value
        response.status = 200
        response.read.return_value = b"<html><title>Moonrail - test</title></html>"

        self.assertEqual(serve.moonrail_url(8765), "http://127.0.0.1:8765/app/")

    @patch("serve.moonrail_url")
    def test_existing_instance_is_reused(self, moonrail_url: MagicMock) -> None:
        moonrail_url.side_effect = [None, "http://127.0.0.1:8766/app/"]

        self.assertEqual(serve.existing_moonrail_url(), "http://127.0.0.1:8766/app/")
        self.assertEqual(moonrail_url.call_count, 2)

    @patch("serve.ReusableServer")
    @patch("serve.open_game")
    @patch("serve.existing_moonrail_url", return_value="http://127.0.0.1:8765/app/")
    def test_main_opens_existing_instance_without_new_server(
        self,
        existing: MagicMock,
        open_game: MagicMock,
        server: MagicMock,
    ) -> None:
        serve.main()

        existing.assert_called_once_with()
        open_game.assert_called_once_with("http://127.0.0.1:8765/app/")
        server.assert_not_called()

    @patch("serve.webbrowser.open")
    def test_browser_can_be_suppressed_for_launcher_smoke(self, browser_open: MagicMock) -> None:
        with patch.dict(os.environ, {"MOONRAIL_NO_BROWSER": "1"}):
            serve.open_game("http://127.0.0.1:8765/app/")

        browser_open.assert_not_called()


if __name__ == "__main__":
    unittest.main()
