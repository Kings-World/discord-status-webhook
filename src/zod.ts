import { z } from "zod";

// discord status incident status
export const incidentStatusEnum = z.enum(["investigating", "identified", "monitoring", "resolved", "postmortem"]);

// discord status incident impact
export const incidentImpactEnum = z.enum(["none", "minor", "major", "critical", "maintenance"]);

// discord status component
export const componentSchema = z.object({
    id: z.string(),
    name: z.string(),
    status: z.string(),
    created_at: z.coerce.date(),
    updated_at: z.coerce.date(),
    position: z.number(),
    description: z.string().nullable(),
    showcase: z.boolean(),
    start_date: z.coerce.date().nullable(),
    group_id: z.string().nullable(),
    page_id: z.string(),
    // not in component update schema (i dont think)
    group: z.boolean().optional(),
    only_show_if_degraded: z.boolean().optional(),
});

// discord status incident
export const incidentSchema = z.object({
    id: z.string(),
    name: z.string(),
    // https://github.com/almostSouji/discord-status-webhook/blob/main/src/interfaces/StatusPage.ts#L44
    status: incidentStatusEnum,
    created_at: z.coerce.date(),
    updated_at: z.coerce.date(),
    monitoring_at: z.coerce.date().nullable(),
    resolved_at: z.coerce.date().nullable(),
    // https://github.com/almostSouji/discord-status-webhook/blob/main/src/interfaces/StatusPage.ts#L45
    impact: incidentImpactEnum,
    shortlink: z.string().url(),
    started_at: z.coerce.date(),
    page_id: z.string(),
    incident_updates: z.array(
        z.object({
            id: z.string(),
            status: z.string(),
            body: z.string(),
            incident_id: z.string(),
            created_at: z.coerce.date(),
            updated_at: z.coerce.date(),
            display_at: z.coerce.date(),
            affected_components: z
                .array(
                    z.object({
                        code: z.string(),
                        name: z.string(),
                        old_status: z.string(),
                        new_status: z.string(),
                    }),
                )
                .nullable(),
            deliver_notifications: z.boolean(),
            custom_tweet: z.string().nullable(),
            tweet_id: z.string().nullable(),
        }),
    ),
    components: z.array(componentSchema),
});

// base schema for discord status webhook
export const baseWebhookSchema = z.object({
    meta: z.object({
        unsubscribe: z.string().url(),
        documentation: z.string().url(),
        generated_at: z.coerce.date(),
    }),
    page: z.object({
        id: z.string(),
        status_indicator: z.string(),
        status_description: z.string(),
    }),
});

// discord status incident webhook
export const incidentWebhookSchema = baseWebhookSchema.extend({
    incident: incidentSchema,
});

// discord status component update webhook
export const componentUpdateWebhookSchema = baseWebhookSchema.extend({
    component: componentSchema,
    component_update: z.object({
        old_status: z.string(),
        new_status: z.string(),
        created_at: z.coerce.date(),
        component_type: z.string(),
        state: z.string(),
        id: z.string(),
        component_id: z.string(),
    }),
});

// https://srhpyqt94yxb.statuspage.io/api/v2/incidents.json
export const incidentsRequestSchema = z.object({
    page: z.object({
        id: z.string(),
        name: z.string(),
        url: z.string().url(),
        time_zone: z.string(),
        updated_at: z.coerce.date(),
    }),
    incidents: z.array(incidentSchema),
});
