-- SQL Script to Delete a User for Testing
-- Replace 'user_email@example.com' with the actual email you want to delete
-- Run this in your Supabase SQL Editor

-- Set the email of the user you want to delete
DO $$
DECLARE
    target_email TEXT := 'user_email@example.com'; -- CHANGE THIS TO THE EMAIL YOU WANT TO DELETE
    target_user_uuid UUID;
BEGIN
    -- Get the user ID from auth.users
    SELECT id INTO target_user_uuid 
    FROM auth.users 
    WHERE email = target_email;
    
    IF target_user_uuid IS NULL THEN
        RAISE NOTICE 'User with email % not found', target_email;
        RETURN;
    END IF;
    
    RAISE NOTICE 'Deleting user with ID: % and email: %', target_user_uuid, target_email;
    
    -- Delete from public tables first (due to foreign key constraints)
    -- Delete user bookings
    DELETE FROM public.bookings WHERE user_id = target_user_uuid;
    RAISE NOTICE 'Deleted user bookings';
    
    -- Delete user invitations/notifications
    DELETE FROM public.invitations WHERE recipient_id = target_user_uuid OR sender_id = target_user_uuid;
    RAISE NOTICE 'Deleted user invitations/notifications';
    
    -- Delete user from tournaments (if they're participants)
    DELETE FROM public.tournament_participants WHERE user_id = target_user_uuid;
    RAISE NOTICE 'Deleted user from tournament participants';
    
    -- Delete user from games (if they're participants)
    DELETE FROM public.game_participants WHERE user_id = target_user_uuid;
    RAISE NOTICE 'Deleted user from game participants';
    
    -- Delete user from friends
    DELETE FROM public.friends WHERE user_id = target_user_uuid OR friend_id = target_user_uuid;
    RAISE NOTICE 'Deleted user from friends';
    
    -- Delete user from teams
    DELETE FROM public.team_members WHERE user_id = target_user_uuid;
    RAISE NOTICE 'Deleted user from team members';
    
    -- Delete user from user_stats (if exists)
    DELETE FROM public.user_stats WHERE user_id = target_user_uuid;
    RAISE NOTICE 'Deleted user stats';
    
    -- Delete user from users table
    DELETE FROM public.users WHERE id = target_user_uuid;
    RAISE NOTICE 'Deleted user from public.users';
    
    -- Finally, delete from auth.users (this will cascade to auth.identities, auth.sessions, etc.)
    DELETE FROM auth.users WHERE id = target_user_uuid;
    RAISE NOTICE 'Deleted user from auth.users';
    
    RAISE NOTICE 'Successfully deleted user with email: %', target_email;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error deleting user: %', SQLERRM;
        RAISE;
END $$;

-- Alternative: If you want to delete by user ID instead of email
-- Replace the UUID below with the actual user ID
/*
DO $$
DECLARE
    target_user_uuid UUID := '00000000-0000-0000-0000-000000000000'; -- CHANGE THIS TO THE USER ID YOU WANT TO DELETE
BEGIN
    -- Same deletion logic as above, but using target_user_uuid instead of looking up by email
    -- ... (copy the deletion logic from above)
END $$;
*/
