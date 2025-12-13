import { Schema } from "effect";

// discord status incident status
export const IncidentStatus = Schema.Literal(
	"investigating",
	"identified",
	"monitoring",
	"resolved",
	"postmortem",
);

// discord status incident impact
export const IncidentImpact = Schema.Literal(
	"none",
	"minor",
	"major",
	"critical",
	"maintenance",
);

// discord status component
export const ComponentSchema = Schema.Struct({
	id: Schema.String,
	name: Schema.String,
	status: Schema.String,
	created_at: Schema.Date,
	updated_at: Schema.Date,
	position: Schema.Number,
	description: Schema.NullOr(Schema.String),
	showcase: Schema.Boolean,
	start_date: Schema.NullOr(Schema.Date),
	group_id: Schema.NullOr(Schema.String),
	page_id: Schema.String,
	// not in component update schema (i don't think)
	group: Schema.optional(Schema.Boolean),
	only_show_if_degraded: Schema.optional(Schema.Boolean),
});

// discord status incident
export const IncidentSchema = Schema.Struct({
	id: Schema.String,
	name: Schema.String,
	// https://github.com/almostSouji/discord-status-webhook/blob/main/src/interfaces/StatusPage.ts#L44
	status: IncidentStatus,
	created_at: Schema.Date,
	updated_at: Schema.NullOr(Schema.Date),
	monitoring_at: Schema.NullOr(Schema.Date),
	resolved_at: Schema.NullOr(Schema.Date),
	// https://github.com/almostSouji/discord-status-webhook/blob/main/src/interfaces/StatusPage.ts#L45
	impact: IncidentImpact,
	shortlink: Schema.URL,
	started_at: Schema.Date,
	page_id: Schema.String,
	incident_updates: Schema.Array(
		Schema.Struct({
			id: Schema.String,
			status: IncidentStatus,
			body: Schema.String,
			incident_id: Schema.String,
			created_at: Schema.Date,
			updated_at: Schema.Date,
			display_at: Schema.Date,
			affected_components: Schema.NullOr(
				Schema.Array(
					Schema.Struct({
						code: Schema.String,
						name: Schema.String,
						old_status: Schema.String,
						new_status: Schema.String,
					}),
				),
			),
			deliver_notifications: Schema.Boolean,
			custom_tweet: Schema.NullOr(Schema.String),
			tweet_id: Schema.NullOr(Schema.String),
		}),
	),
	components: Schema.Array(ComponentSchema),
});

// base schema for discord status webhook
export const BaseWebhookSchema = Schema.Struct({
	meta: Schema.Struct({
		unsubscribe: Schema.URL,
		documentation: Schema.URL,
		generated_at: Schema.Date,
	}),
	page: Schema.Struct({
		id: Schema.String,
		status_indicator: Schema.String,
		status_description: Schema.String,
	}),
});

// discord status incident webhook
export const IncidentWebhookSchema = Schema.extend(
	BaseWebhookSchema,
	Schema.Struct({
		incident: IncidentSchema,
	}),
);

// discord status component update webhook
export const ComponentUpdateWebhookSchema = Schema.extend(
	BaseWebhookSchema,
	Schema.Struct({
		component: ComponentSchema,
		component_update: Schema.Struct({
			old_status: Schema.String,
			new_status: Schema.String,
			created_at: Schema.Date,
			component_type: Schema.String,
			state: Schema.String,
			id: Schema.String,
			component_id: Schema.String,
		}),
	}),
);

export const WebhookPayloadSchema = Schema.Union(
	IncidentWebhookSchema,
	ComponentUpdateWebhookSchema,
);

// https://discordstatus.com/api/v2/incidents.json
export const IncidentsRequestSchema = Schema.Struct({
	page: Schema.Struct({
		id: Schema.String,
		name: Schema.String,
		url: Schema.URL,
		time_zone: Schema.String,
		updated_at: Schema.Date,
	}),
	incidents: Schema.Array(IncidentSchema),
});

export type IncidentSchemaType = typeof IncidentSchema.Type;
export type IncidentStatusType = typeof IncidentStatus.Type;
