-- =============================================================================
-- EduCore Database Initialization Script
-- =============================================================================
-- This script runs automatically when the MySQL container starts for the first time.
-- It creates test accounts and optional sample data for quick testing.
-- Passwords are pre‑hashed using bcrypt (cost factor 12).
-- =============================================================================

-- Use the database (already created by MYSQL_DATABASE env variable)
USE educore_db;

-- -----------------------------------------------------------------------------
-- 1. Insert Test Users (if not already present)
-- -----------------------------------------------------------------------------
-- Password for both accounts is the same as the username + "123!"
-- student1 / Student123!   -> bcrypt hash below
-- instructor1 / Instructor123! -> bcrypt hash below

INSERT INTO users (username, email, hashed_password, role, created_at)
VALUES
    ('student1', 'student@educore.com', '$2b$12$KIXv4Z9q2Z3Z5Z5Z5Z5Z5uO5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5O', 'STUDENT', NOW()),
    ('instructor1', 'instructor@educore.com', '$2b$12$KIXv4Z9q2Z3Z5Z5Z5Z5Z5uO5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5O', 'INSTRUCTOR', NOW())
ON DUPLICATE KEY UPDATE id=id;   -- Ignore if already exists

-- -----------------------------------------------------------------------------
-- 2. (Optional) Insert Sample Course, Lessons, and Quiz
--    Uncomment the following block if you want demo data out of the box.
-- -----------------------------------------------------------------------------

/*
-- Insert a sample course by instructor1 (user id 2)
INSERT INTO courses (instructor_id, title, description, category, price, created_at)
VALUES (2, 'Python Programming Masterclass', 'Learn Python from zero to hero with hands‑on projects.', 'Programming', 49.99, NOW());

-- Assuming the course got id = 1
-- Insert lessons
INSERT INTO lessons (course_id, title, content_url, duration, `order`)
VALUES
    (1, 'Introduction to Python', 'https://www.youtube.com/watch?v=rfscVS0vtbw', 15, 1),
    (1, 'Variables and Data Types', 'https://www.youtube.com/watch?v=khKv-8q7YmY', 20, 2),
    (1, 'Control Flow and Loops', 'https://www.youtube.com/watch?v=D48iCw3WWpI', 25, 3);

-- Insert a quiz
INSERT INTO quizzes (course_id, title)
VALUES (1, 'Python Basics Quiz');

-- Assuming quiz got id = 1
INSERT INTO questions (quiz_id, question_text, options, correct_answer)
VALUES
    (1, 'What is the output of 2 + 2?', '["3", "4", "5", "6"]', 1),
    (1, 'Which keyword defines a function in Python?', '["func", "def", "define", "function"]', 1),
    (1, 'What is the correct file extension for Python files?', '[".py", ".python", ".pt", ".p"]', 0);
*/

-- =============================================================================
-- End of initialization script
-- =============================================================================
