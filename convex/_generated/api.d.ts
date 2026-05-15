/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as automation from "../automation.js";
import type * as chainActions from "../chainActions.js";
import type * as chainProofs from "../chainProofs.js";
import type * as crons from "../crons.js";
import type * as history from "../history.js";
import type * as lib_auth from "../lib/auth.js";
import type * as notifications from "../notifications.js";
import type * as paymentActions from "../paymentActions.js";
import type * as payments from "../payments.js";
import type * as tontines from "../tontines.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  automation: typeof automation;
  chainActions: typeof chainActions;
  chainProofs: typeof chainProofs;
  crons: typeof crons;
  history: typeof history;
  "lib/auth": typeof lib_auth;
  notifications: typeof notifications;
  paymentActions: typeof paymentActions;
  payments: typeof payments;
  tontines: typeof tontines;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
