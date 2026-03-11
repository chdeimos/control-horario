-- Permite que las horas de entrada y salida sean nulas para soportar el horario flexible
ALTER TABLE work_schedules ALTER COLUMN start_time DROP NOT NULL;
ALTER TABLE work_schedules ALTER COLUMN end_time DROP NOT NULL;
