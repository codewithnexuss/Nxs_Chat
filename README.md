# NXS Chat

A modern, real-time chat application built with React, TypeScript, and Supabase.

## Features
- **Real-time Messaging**: Instant message delivery and updates.
- **Media Support**: Send images, videos, and files.
- **Modern UI**: Glossy, glassmorphism-inspired design with dark mode support.
- **Privacy Controls**: Block users and manage interactions.

## Setup

1. **Install Dependencies**:
```bash
npm install
```

2. **Run Development Server**:
```bash
npm run dev
```

## Database Setup (Troubleshooting)

If you encounter "Bucket not found" errors for file uploads, run this SQL in your Supabase Dashboard:

```sql
-- Create storage bucket
insert into storage.buckets (id, name, public)
values ('chat-attachments', 'chat-attachments', true)
on conflict (id) do nothing;

-- Allow public read access
create policy "Public Access chat-attachments"
  on storage.objects for select
  using ( bucket_id = 'chat-attachments' );

-- Allow authenticated uploads
create policy "Authenticated Uploads chat-attachments"
  on storage.objects for insert
  to authenticated
  with check ( bucket_id = 'chat-attachments' );

-- Add missing file_url column to messages table
alter table messages
add column if not exists file_url text;
```
