import type { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { createMigratedDatabase } from "./helpers/db";

const state = vi.hoisted(() => ({ pg: null as PGlite | null, failAudit: false, requireUser: vi.fn(), refresh: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/hq/auth", () => ({ requireUser: state.requireUser }));
vi.mock("@/lib/hq/hackathon", () => ({ requireHackathon: async () => ({ id: 11 }) }));
vi.mock("@/lib/hq/revalidation", () => ({ refreshHq: state.refresh }));
vi.mock("pg", () => ({ Pool: class {
  on() { return this; }
  query(text: string, values: unknown[] = []) { return state.pg!.query(text, values); }
  async connect() { return {
    query: (text: string, values: unknown[] = []) => {
      if (state.failAudit && /INSERT INTO hq_activity/.test(text)) throw new Error("Audit unavailable");
      return state.pg!.query(text, values);
    },
    release() {},
  }; }
} }));

import { updatePartnerDetail } from "@/lib/hq/actions/partners";
import { updatePerson } from "@/lib/hq/actions/people";
import { updateProjectDetail } from "@/lib/hq/actions/projects";

const id = (suffix: number) => `00000000-0000-4000-8000-${String(suffix).padStart(12, "0")}`;
const OPERATOR = id(1), PROJECT = id(2), PERSON = id(4), PARTNER = id(5), FOREIGN_PARTNER = id(6);
const CHANNEL = id(7), OTHER_CHANNEL = id(8), ROLE = id(10);
const rows = async (sql: string, values: unknown[] = []) => (await state.pg!.query(sql, values)).rows;

beforeAll(async () => {
  vi.stubEnv("DATABASE_URL", "postgres://test.invalid/operator-fields");
  state.pg = await createMigratedDatabase();
  await state.pg.exec(`
    INSERT INTO hq_users(id,username,display_name,password_hash) VALUES('${OPERATOR}','operator','Operator','unused');
    INSERT INTO hq_partner_channels(id,label) VALUES('${CHANNEL}','Community'),('${OTHER_CHANNEL}','University');
    INSERT INTO hq_people_roles(id,label,filter_label,color,bg) VALUES('${ROLE}','Guest','Guests','green','green');
    INSERT INTO hq_project_statuses(slug,label,color) VALUES('green','Green','green');
    INSERT INTO hq_project_forecasts(slug,label,color) VALUES('likely','Likely','green');
  `);
});
beforeEach(async () => {
  state.failAudit = false;
  state.requireUser.mockReset().mockResolvedValue({ id: OPERATOR });
  state.refresh.mockClear();
  await state.pg!.exec(`
    DELETE FROM hq_hackathons;
    INSERT INTO hq_hackathons(id,slug,name,start_date,end_date) VALUES
      (11,'selected','Selected','2026-09-14','2026-10-12'),(12,'other','Other','2026-09-14','2026-10-12');
    INSERT INTO hq_partners(id,hackathon_id,name,channel_id,stage_id)
      SELECT '${PARTNER}',11,'Partner','${CHANNEL}',id FROM hq_partner_stages WHERE slug='rejected';
    INSERT INTO hq_partners(id,hackathon_id,name,channel_id,stage_id)
      SELECT '${FOREIGN_PARTNER}',12,'Foreign','${CHANNEL}',id FROM hq_partner_stages WHERE slug='rejected';
    INSERT INTO hq_projects(id,hackathon_id,name,lead_name,status_id,forecast_id,last_check_in)
      SELECT '${PROJECT}',11,'Project','Lead',s.id,f.id,'2026-09-14' FROM hq_project_statuses s CROSS JOIN hq_project_forecasts f;
    INSERT INTO hq_people(id,hackathon_id,name,role_id) VALUES('${PERSON}',11,'Person','${ROLE}');
  `);
});
afterAll(async () => { await state.pg?.close(); vi.unstubAllEnvs(); });

describe("operator field edits", () => {
  it("preserves project attribution rules, touches, and rename activity", async () => {
    expect(await updateProjectDetail(PROJECT, { field: "name", value: "  New project  " })).toEqual({ ok: true });
    expect(await updateProjectDetail(PROJECT, { field: "partnerId", value: PARTNER })).toEqual({ ok: true });
    expect(await rows("SELECT partner_id FROM hq_projects")).toEqual([{ partner_id: PARTNER }]);
    expect(await updateProjectDetail(PROJECT, { field: "partnerId", value: FOREIGN_PARTNER })).toEqual({ ok: true });
    expect(await rows("SELECT name,lead_name,partner_id,touched_by_user_id,touched_at IS NOT NULL AS touched FROM hq_projects"))
      .toEqual([{ name: "New project", lead_name: "Lead", partner_id: null, touched_by_user_id: OPERATOR, touched: true }]);
    expect(await rows("SELECT message FROM hq_activity ORDER BY id")).toEqual([
      { message: "Renamed project to New project" }, { message: "Updated New project" }, { message: "Updated New project" },
    ]);
  });

  it("keeps partner channel validation and field-specific activity", async () => {
    expect(await updatePartnerDetail(PARTNER, { field: "channelId", value: id(99) })).toEqual({ ok: false });
    expect(await updatePartnerDetail(PARTNER, { field: "channelId", value: OTHER_CHANNEL })).toEqual({ ok: true });
    expect(await updatePartnerDetail(PARTNER, { field: "target", value: 42 })).toEqual({ ok: true });
    expect(await rows("SELECT name,channel_id,target,captain_name FROM hq_partners WHERE id=$1", [PARTNER]))
      .toEqual([{ name: "Partner", channel_id: OTHER_CHANNEL, target: 42, captain_name: "" }]);
    expect(await rows("SELECT message FROM hq_activity ORDER BY id")).toEqual([
      { message: "Partner channel set to University" }, { message: "Target updated on Partner" },
    ]);
  });

  it("parameterizes person notes without changing the name or role", async () => {
    const body = "'); DELETE FROM hq_people; --";
    expect(await updatePerson(PERSON, { field: "notes", value: body })).toEqual({ ok: true });
    expect(await rows("SELECT name,role_id,notes FROM hq_people")).toEqual([{ name: "Person", role_id: ROLE, notes: body }]);
    expect(await rows("SELECT message FROM hq_activity")).toEqual([{ message: "Updated Person" }]);
  });

  it.each([
    ["project", () => updateProjectDetail(PROJECT, { field: "name", value: "Changed" }), "hq_projects"],
    ["person", () => updatePerson(PERSON, { field: "name", value: "Changed" }), "hq_people"],
    ["partner", () => updatePartnerDetail(PARTNER, { field: "name", value: "Changed" }), "hq_partners"],
  ] as const)("rolls back the %s edit and touches when its activity write fails", async (_, action, table) => {
    const before = await rows(`SELECT * FROM ${table} ORDER BY id`);
    state.failAudit = true;
    await expect(action()).rejects.toThrow("Audit unavailable");
    expect(await rows(`SELECT * FROM ${table} ORDER BY id`)).toEqual(before);
    expect(await rows("SELECT * FROM hq_activity")).toEqual([]);
    expect(state.refresh).not.toHaveBeenCalled();
  });
});
