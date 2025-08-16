-- Migration: Add delivered_at field to private_messages table
-- This enables tracking of message delivery status for offline users

-- Add delivered_at column to track when message was delivered to client
ALTER TABLE private_messages 
ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ DEFAULT NULL;

-- Add index for better query performance on delivered messages
CREATE INDEX IF NOT EXISTS idx_private_messages_delivered_at 
ON private_messages (delivered_at);

-- Add index for efficient offline message queries
CREATE INDEX IF NOT EXISTS idx_private_messages_conversation_sender_delivered 
ON private_messages (conversation_id, sender_id, delivered_at);

-- Update existing messages to mark as delivered if read_at is set
-- (Assumes if it was read, it must have been delivered)
UPDATE private_messages 
SET delivered_at = read_at 
WHERE read_at IS NOT NULL AND delivered_at IS NULL;

-- Add comments for documentation
COMMENT ON COLUMN private_messages.delivered_at IS 'Timestamp when message was successfully delivered to recipient client';
COMMENT ON INDEX idx_private_messages_delivered_at IS 'Index for efficient message delivery status queries';
COMMENT ON INDEX idx_private_messages_conversation_sender_delivered IS 'Index for offline message queries by conversation and sender';
