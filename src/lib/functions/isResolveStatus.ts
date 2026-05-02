import type { IncidentStatusEnum } from "../zod";

export function isResolveStatus(status: IncidentStatusEnum) {
	return status === "resolved" || status === "postmortem";
}
