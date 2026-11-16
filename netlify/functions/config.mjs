import { publicConfig } from "../../shared/config.mjs";
import { json } from "../lib/store.mjs";

export default async () => json(publicConfig());
export const config = { path: "/api/config" };
