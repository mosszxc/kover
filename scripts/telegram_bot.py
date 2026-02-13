#!/usr/bin/env python3
"""
Telegram Bot Polling Script for Local Development.

Instead of webhook (requires public URL), this script uses long polling
to receive updates from Telegram and process them locally.

Usage:
    cd apps/api && uv run python ../../scripts/telegram_bot.py
"""

import asyncio
import logging
import sys
from pathlib import Path

# Add apps/api/src to path
sys.path.insert(0, str(Path(__file__).parent.parent / "apps" / "api"))

from src.clients.telegram import TelegramClient
from src.core.config import settings
from src.core.database import get_db
from src.domains.auth.service import process_telegram_webhook

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(message)s",
)
logger = logging.getLogger(__name__)


async def run_polling():
    """Run Telegram bot with long polling."""

    if not settings.telegram_bot_token:
        logger.error("TELEGRAM_BOT_TOKEN not set in environment")
        return

    client = TelegramClient()
    db = get_db()

    # Delete webhook to enable polling
    logger.info("Deleting webhook to enable polling mode...")
    await client.delete_webhook()

    # Get bot info
    bot_info = await client.get_me()
    logger.info(f"Bot started: @{bot_info.get('username')} (ID: {bot_info.get('id')})")
    logger.info("Listening for messages... (Ctrl+C to stop)")

    offset = None

    while True:
        try:
            updates = await client.get_updates(offset=offset, timeout=30)

            for update in updates:
                update_id = update.get("update_id")
                offset = update_id + 1  # Next update after this one

                # Log the update
                message = update.get("message", {})
                from_user = message.get("from", {})
                text = message.get("text", "")
                username = from_user.get("username", "unknown")

                logger.info(f"Message from @{username}: {text}")

                # Process via existing service
                await process_telegram_webhook(db, update)

        except asyncio.CancelledError:
            logger.info("Polling stopped")
            break
        except Exception as e:
            logger.error(f"Error during polling: {e}")
            await asyncio.sleep(5)  # Wait before retry


def main():
    """Entry point."""
    try:
        asyncio.run(run_polling())
    except KeyboardInterrupt:
        logger.info("Bot stopped by user")


if __name__ == "__main__":
    main()
