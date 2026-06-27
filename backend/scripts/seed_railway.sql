-- ================================================================================
-- MEDMOVE RAILWAY MYSQL IMPORT SEED DATA
-- Purpose: Initial production seed data for Railway MySQL database import
-- Cities Covered: Chennai, Madurai, Coimbatore, Sivakasi
-- ================================================================================

-- 1. INSERT DEMO PROVIDERS (2 Providers)
INSERT INTO `providers` (`id`, `company_name`, `owner_name`, `phone`, `email`, `password_hash`, `address`, `service_area`, `license_number`, `is_approved`, `createdAt`, `updatedAt`) VALUES
(1, 'Aarthi Ambulance Service', 'Ramesh Kumar', '9876543210', 'aarthi@medmove.in', '$2b$10$VFa6wwKL.ATOrqvH8scd5O6t7zXDjPdWYgLtsq9JxXScf279UkA72', '12 Anna Salai, Chennai', 'Chennai, Madurai', 'TN-MED-2026-001', TRUE, NOW(), NOW()),
(2, 'Krishna Ambulance Service', 'Suresh Raj', '9876543211', 'krishna@medmove.in', '$2b$10$VFa6wwKL.ATOrqvH8scd5O6t7zXDjPdWYgLtsq9JxXScf279UkA72', '45 Main Road, Coimbatore', 'Coimbatore, Sivakasi', 'TN-MED-2026-002', TRUE, NOW(), NOW());

-- 2. INSERT DEMO AMBULANCES (4 Vehicles - 2 Per Provider)
INSERT INTO `ambulances` (`id`, `vehicle_number`, `type`, `driver_name`, `driver_phone`, `base_location`, `base_charge`, `price_per_km`, `status`, `equipment`, `provider_id`, `createdAt`, `updatedAt`) VALUES
(1, 'TN01AB1234', 'basic', 'Anil Kumar', '9123456780', 'Chennai', 500, 15, 'available', '["Stretcher", "First Aid Kit", "Oxygen Cylinder"]', 1, NOW(), NOW()),
(2, 'TN01CD5678', 'oxygen', 'Murugan', '9123456781', 'Madurai', 800, 20, 'available', '["Stretcher", "Oxygen Support", "Pulse Oximeter"]', 1, NOW(), NOW()),
(3, 'TN37EF9012', 'basic', 'Vijay', '9123456782', 'Coimbatore', 450, 14, 'available', '["Stretcher", "First Aid Kit"]', 2, NOW(), NOW()),
(4, 'TN84GH3456', 'icu', 'Karthik', '9123456783', 'Sivakasi', 1500, 35, 'available', '["Ventilator", "Defibrillator", "Patient Monitor", "Infusion Pump"]', 2, NOW(), NOW());

-- 3. INSERT DEMO PATIENT USER (1 Patient User)
-- Password for demo@medmove.in is 'Demo@1234'
INSERT INTO `users` (`id`, `full_name`, `phone`, `email`, `password_hash`, `is_verified`, `createdAt`, `updatedAt`) VALUES
(1, 'Demo Patient', '9999999999', 'demo@medmove.in', '$2b$10$VFa6wwKL.ATOrqvH8scd5O6t7zXDjPdWYgLtsq9JxXScf279UkA72', TRUE, NOW(), NOW());
