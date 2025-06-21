import { toTitleCase } from "@sapphire/utilities";
import { EmbedBuilder, time } from "discord.js";
import { eq } from "drizzle-orm";
import { DateTime } from "luxon";
import { logger, roleId, statusData, webhook } from "../constants.js";
import { db } from "../db/drizzle.js";
import { discordStatus } from "../db/schema.js";
import type { IncidentSchema } from "../zod.js";

function createEmbed(incident: IncidentSchema) {
    return new EmbedBuilder()
        .setTitle(incident.name)
        .setURL(incident.shortlink)
        .setFooter({ text: "Started" })
        .setTimestamp(incident.started_at)
        .setColor(statusData[incident.status][0])
        .setAuthor({
            name: "Discord Status",
            iconURL:
                "https://discord.com/assets/f9bb9c4af2b9c32a2c5ee0014661546d.png",
        })
        .setFields(
            incident.incident_updates.toReversed().map((update) => ({
                name: `<:${update.status}:${statusData[update.status][1]}> ${toTitleCase(update.status)} (${time(update.created_at, "R")})`,
                value: update.body,
            })),
        );
}

async function createAndSendStatus(incident: IncidentSchema) {
    if (!webhook) return;
    logger.info(
        `DiscordStatus[${incident.id}] Sending ${incident.name} (${incident.status}) to Discord`,
    );

    const message = await webhook.send({
        content: roleId ? `<@&${roleId}>` : undefined,
        allowedMentions: { roles: roleId ? [roleId] : [] },
        embeds: [createEmbed(incident)],
    });

    await db.insert(discordStatus).values({
        incidentId: incident.id,
        messageId: message.id,
        status: incident.status,
        updateId: incident.incident_updates[0].id,
    });
}

async function updateStatus(
    status: typeof discordStatus.$inferSelect,
    incident: IncidentSchema,
) {
    if (!webhook) return;
    logger.info(
        `DiscordStatus[${incident.id}] Updating ${incident.name} from ${status.status} to ${incident.status}`,
    );

    await webhook.editMessage(status.messageId, {
        embeds: [createEmbed(incident)],
    });

    await db
        .update(discordStatus)
        .set({
            status: incident.status,
            updateId: incident.incident_updates[0].id,
        })
        .where(eq(discordStatus.incidentId, incident.id));
}

export async function processDiscordIncident(incident: IncidentSchema) {
    if (!webhook) return;

    const status = await db.query.discordStatus.findFirst({
        where: eq(discordStatus.incidentId, incident.id),
    });
    if (!status) {
        await createAndSendStatus(incident);
        return;
    }

    const incidentUpdate = DateTime.fromJSDate(
        incident.updated_at ?? incident.created_at,
    );
    if (DateTime.fromJSDate(status.updatedAt) < incidentUpdate) {
        await updateStatus(status, incident);
    }
}
