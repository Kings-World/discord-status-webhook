# Discord Status Webhook

A Discord webhook that shares updates on Discord's API status: <https://discordstatus.com/>.

## Installation

### Docker compose

```yml
# compose.yml
services:
  discord-status-webhook:
    image: ghcr.io/kings-world/discord-status-webhook:latest
    container_name: discord-status-webhook
    restart: unless-stopped
    ports:
      # [Optional] Only required if you want to "Subscribe to Updates" on discordstatus.com.
      - "3000:3000"
    environment:
      # [Required] The URL of the postgres database
      - DATABASE_URL=
      # [Required] The ID of the Discord Webhook to send status updates to
      - WEBHOOK_ID=
      # [Required] The token of the Discord Webhook to send status updates to
      - WEBHOOK_TOKEN=
      # [Optional] The Role ID to mention when sending status updates
      # If not set or left blank, no role will be mentioned
      - ROLE_ID=
      # [Optional] Custom emojis to use for each status
      # If not set or left blank, emojis will not be included in status update messages
      # The emojis that I use can be found in the emojis directory of the GitHub repo
      - IDENTIFIED_STATUS_EMOJI=
      - INVESTIGATING_STATUS_EMOJI=
      - MONITORING_STATUS_EMOJI=
      - RESOLVED_STATUS_EMOJI=
```

After creating `compose.yml` with the above, you can start the stack with `docker compose up -d`.

When you run `docker compose up -d` for the first time, Docker will pull the image before starting the Discord status webhook.

Additional commands:

- Pull the image manually: `docker compose pull`
- View the logs: `docker compose logs`
- Follow the logs: `docker compose logs -f`
- Stop the Discord status webhook: `docker compose down`

### Manual

This method is for technical people!

```bash
# 1. Clone the repo with HTTP, SSH, or the GitHub CLI (your preference)
git clone https://github.com/Kings-World/discord-status-webhook.git
# Clone with SSH:
#   git clone git@github.com:Kings-World/discord-status-webhook.git
# Clone with the GitHub CLI: 
#   gh repo clone Kings-World/discord-status-webhook

# 2. Install the dependencies
bun install

# 3. Set environment variables
mv .env.example .env
# You will then need to open `.env` and set the values.

# 4. Start the Discord status webhook
bun run start
```

## Information

### Emojis

The emojis that I use can be found in the [/emojis](/emojis) directory. Upload them to your server and set the environment variables to their IDs.

#### How do I get the IDs?

If you have developer mode enabled on Discord, you can right click the emojis and copy ID.

However, if you don't have developer mode enabled, you can mention the emoji and place a `\` before it. For example: `\:identified_status:`.

Once you send the emoji with the `\` before the mention, Discord will show something like `<:emoji-name:1234567889>`. The long number (in this case, 1234567889) is the ID.

### Webhook

In terms of the webhook ID and token, you have to grab those from the webhook URL that you copy.

Webhook schema:

```yaml
https://discord.com/api/webhooks/:WEBHOOK_ID/:WEBHOOK_TOKEN
```

Example:

```yaml
https://discord.com/api/webhooks/123456789/some-secret-token-do-not-share

Webhook ID: 123456789
Webhook Token: some-secret-token-do-not-share

# environment:
#   - WEBHOOK_ID=123456789
#   - WEBHOOK_TOKEN=some-secret-token-do-not-share
```

## Support

If you need any help with anything, please feel free to ask via [GitHub Discussions][discussions] or via our [Discord server][discord].

[discussions]: https://github.com/Kings-World/discord-status-webhook/discussions
[discord]: https://discord.gg/DDangtgdJM
