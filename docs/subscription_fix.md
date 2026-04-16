# Subscription System Fixes - February 17, 2026

## Overview
This document details the debugging process and resolution for the issue where the subscription page (`/admin/subscribe`) was failing to load or process checkouts correctly.

## Issues Identified

### 1. Stripe API Key Configuration
*   **Problem:** The `firestore-stripe-payments` Firebase Extension was configured with an invalid Stripe API Key (`rk_test_...`).
*   **Symptom:** The extension failed to create Stripe customer records when new users signed up. Cloud Function logs showed: `Error: ❗️[Error]: Failed to create customer for [...]: Invalid API Key provided`.
*   **Resolution:** The Stripe API key was manually updated in the Firebase Console to a valid key (`sk_live_...` or valid test key).

### 2. Firestore Collection Mismatch
*   **Problem:** The frontend code in `app/admin/subscribe/page.tsx` was querying the `customers` collection for user subscription data. However, the Firebase Extension was configured to sync customer data to the `users` collection (`CUSTOMERS_COLLECTION=users` in extension config).
*   **Symptom:** The application persistently reported "Customer document does not exist" even after the API key was fixed and the customer record was successfully created in Stripe.
*   **Resolution:** The frontend code was updated to query `db.collection('users').doc(user.uid)` instead of `customers`.

### 3. Customer Creation Latency (Race Condition)
*   **Problem:** There is a delay between a user signing up (or resetting their account) and the Firebase Extension successfully creating the Stripe customer record and writing it back to Firestore.
*   **Symptom:** Users attempting to subscribe immediately after signup might encounter a failure because the `stripeId` field hadn't populated yet.
*   **Resolution:** Implemented a retry mechanism in `SubscribePage` that waits up to 10 seconds (checking every 1 second) for the `stripeId` to appear on the user document before failing.

### 4. Broken Legacy Accounts
*   **Problem:** Accounts created while the API key was invalid never had a customer record created. The extension does not automatically backfill these.
*   **Symptom:** Existing users were stuck in a broken state unable to subscribe.
*   **Resolution:** Added a "Reset Account" feature in the UI. If the system detects a missing customer record after retries, it offers the user a button to delete their account so they can sign up again, triggering a fresh customer creation.

## Code Changes

### `app/admin/subscribe/page.tsx`
*   **Collection Path:** Changed `doc(db, 'customers', user.uid)` to `doc(db, 'users', user.uid)`.
*   **Retry Logic:** Added a `while` loop to poll for the `stripeId` field.
*   **Error Handling:** Added specific checks for missing customer data and the "Reset Account" UI flow.
*   **Subscription Check:** Updated the initial subscription check to look in `users/{uid}/subscriptions` instead of `customers/{uid}/subscriptions`.

### `firebase.json`
*   **Firestore Rules:** Fixed deployment configuration to ensure the correct `firestore.rules` file is deployed to the `upstander---v4` project (previously there was a mismatch with project aliases).

## Verification
To verify the system is working:
1.  **New User:** Sign up with a new email.
2.  **Navigate:** Go to `/admin/subscribe`.
3.  **Action:** Click "Subscribe" on a plan.
4.  **Result:** The button should briefly show "Preparing Checkout..." (while waiting for the extension if needed) and then redirect to the Stripe checkout page.

## Future Recommendations
*   **Extension Config:** Ensure any future environments (staging/prod) have the `CUSTOMERS_COLLECTION` set to `users` to match the codebase, or update the codebase to match the configuration.
*   **Monitoring:** Monitor Firebase Extension logs for `ext-firestore-stripe-payments-createCustomer` to ensure API keys remain valid.
