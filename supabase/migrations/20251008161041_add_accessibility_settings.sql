/*
  # Add Accessibility Settings to User Preferences

  ## Overview
  Adds accessibility options to user_settings table for WCAG compliance.

  ## Changes
  1. Add accessibility_preferences column to user_settings
     - screen_reader_enabled (boolean) - Text-to-speech toggle
     - high_contrast (boolean) - High contrast mode
     - reduced_motion (boolean) - Reduce animations
     - font_size (text) - normal, large, extra_large
     - keyboard_shortcuts (boolean) - Enable keyboard navigation shortcuts

  ## Notes
  - Defaults to accessible settings for new users
  - Existing users will get default values
*/

-- Add accessibility_preferences column to user_settings
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_settings'
    AND column_name = 'accessibility_preferences'
  ) THEN
    ALTER TABLE user_settings
    ADD COLUMN accessibility_preferences jsonb DEFAULT '{
      "screen_reader_enabled": false,
      "high_contrast": false,
      "reduced_motion": false,
      "font_size": "normal",
      "keyboard_shortcuts": true,
      "focus_indicators": true
    }'::jsonb;
  END IF;
END $$;

-- Create index for faster accessibility settings lookups
CREATE INDEX IF NOT EXISTS idx_user_settings_accessibility
  ON user_settings USING GIN (accessibility_preferences);

-- Add helpful comment
COMMENT ON COLUMN user_settings.accessibility_preferences IS 'WCAG compliance settings including screen reader, contrast, motion, and keyboard navigation preferences';
