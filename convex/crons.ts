import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.interval(
  "apply tontine deadlines and payouts",
  { minutes: 15 },
  internal.automation.processDeadlines
);

export default crons;
