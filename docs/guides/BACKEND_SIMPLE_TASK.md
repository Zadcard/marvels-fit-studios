# Simple Backend Task

## Task Name
Make `Join Now` save data to the database

## Goal
The landing page `Join Now` form should send real data to the database instead of showing a fake success message.

## Scope
Only do the minimum backend work needed for this flow.

## What The Form Should Save
- `fullName`
- `phone`
- `email`
- `passwordHash`
- `message`
- `createdAt`

## Backend Rules
- Do not save the password as plain text.
- Hash the password before saving it.
- Reject duplicate emails.
- Return a success message if the save works.
- Return an error message if validation fails or the email already exists.

## Required Backend Work
1. Add a database table/model for landing registrations or leads.
2. Add backend validation for the form data.
3. Add a server action or backend handler that receives the form submission.
4. Hash the password.
5. Save the record to the database.
6. Return success/error state to the landing page form.

## Not Included
- Login
- account creation
- dashboard integration
- admin management for leads
- email sending
- notifications
- approval flow

## Definition Of Done
- Submitting `Join Now` writes a new row to the database.
- The password is stored hashed.
- Duplicate email submissions are blocked.
- The user sees a real success or error message.

## Recommended Stack
- `Next.js App Router`
- `Server Actions`
- `legacy ORM`
- `PostgreSQL`

## Short Implementation Summary
Use the landing form to call a server action.
The server action validates the form, hashes the password, checks if the email already exists, then saves the data into a dedicated `Lead` or `Registration` table.
