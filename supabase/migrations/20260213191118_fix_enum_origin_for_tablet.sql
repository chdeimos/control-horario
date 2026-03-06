-- Fix enum by adding the value outside a DO block
ALTER TYPE entry_origin ADD VALUE IF NOT EXISTS 'hardware_tablet';
