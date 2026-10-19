-- Living Cube: shared geometry, bounded locomotion, visual screening, three usable levels.
-- Local private-beta preparation only. No hosted application or learner launch implied.
BEGIN;
ALTER TABLE public.campus_presence ADD COLUMN floor integer NOT NULL DEFAULT 0 CHECK(floor BETWEEN 0 AND 2),
 ADD COLUMN elevation double precision NOT NULL DEFAULT 0 CHECK(elevation BETWEEN 0 AND 25.21),
 ADD COLUMN stance text NOT NULL DEFAULT 'stand' CHECK(stance IN ('stand','crouch','prone')),
 ADD COLUMN travel jsonb DEFAULT NULL CHECK(travel IS NULL OR jsonb_typeof(travel)='object'),
 ADD COLUMN jump_at timestamptz,ADD COLUMN input_run boolean NOT NULL DEFAULT false,ADD COLUMN input_jump boolean NOT NULL DEFAULT false;
ALTER TABLE public.campus_presence DROP CONSTRAINT campus_presence_seat_check;
ALTER TABLE public.campus_presence ADD CONSTRAINT campus_presence_seat_check CHECK(seat IN ('desk-1','desk-2','desk-3','desk-4','lab-1','lab-2','lab-3','lab-4','class-1','class-2','seminar-1','seminar-2','project-1','project-2','digital-1','digital-2','astronomy-1','astronomy-2','quiet-1','quiet-2'));
CREATE TABLE public.campus_focus_glass(room text PRIMARY KEY CHECK(room='library'),frosted text[] NOT NULL DEFAULT '{}');
INSERT INTO public.campus_focus_glass(room) VALUES('library');
ALTER TABLE public.campus_focus_glass ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.campus_focus_glass FROM PUBLIC,anon,authenticated,service_role;
CREATE TABLE public.campus_school_solids(floor integer NOT NULL,min_x double precision NOT NULL,max_x double precision NOT NULL,min_z double precision NOT NULL,max_z double precision NOT NULL);
INSERT INTO public.campus_school_solids VALUES (0,-36.18,-15.82,-35.18,-34.82),
(0,-36.18,-35.82,-35,-17),
(0,-16.18,-15.82,-35,-17),
(0,-36,-28.4,-17.18,-16.82),
(0,-23.6,-16,-17.18,-16.82),
(0,-10.18,10.18,-35.18,-34.82),
(0,-10.18,-9.82,-35,-17),
(0,9.82,10.18,-35,-17),
(0,-10,-2.4,-17.18,-16.82),
(0,2.4,10,-17.18,-16.82),
(0,15.82,36.18,-35.18,-34.82),
(0,15.82,16.18,-35,-17),
(0,35.82,36.18,-35,-17),
(0,16,23.6,-17.18,-16.82),
(0,28.4,36,-17.18,-16.82),
(0,-62.18,-41.82,-9.18,-8.82),
(0,-62.18,-61.82,-9,9),
(0,-42.18,-41.82,-9,9),
(0,-62,-54.4,8.82,9.18),
(0,-49.6,-42,8.82,9.18),
(0,-36.18,-15.82,-9.18,-8.82),
(0,-36.18,-35.82,-9,9),
(0,-16.18,-15.82,-9,9),
(0,-36,-28.4,8.82,9.18),
(0,-23.6,-16,8.82,9.18),
(0,-10.18,10.18,-9.18,-8.82),
(0,-10.18,-9.82,-9,9),
(0,9.82,10.18,-9,9),
(0,-10,-2.4,8.82,9.18),
(0,2.4,10,8.82,9.18),
(0,15.82,36.18,-9.18,-8.82),
(0,15.82,16.18,-9,9),
(0,35.82,36.18,-9,9),
(0,16,23.6,8.82,9.18),
(0,28.4,36,8.82,9.18),
(0,-62.18,-41.82,16.82,17.18),
(0,-62.18,-61.82,17,35),
(0,-42.18,-41.82,17,35),
(0,-62,-54.4,34.82,35.18),
(0,-49.6,-42,34.82,35.18),
(0,-36.18,-15.82,16.82,17.18),
(0,-36.18,-35.82,17,35),
(0,-16.18,-15.82,17,35),
(0,-36,-28.4,34.82,35.18),
(0,-23.6,-16,34.82,35.18),
(0,-10.18,10.18,16.82,17.18),
(0,-10.18,-9.82,17,35),
(0,9.82,10.18,17,35),
(0,-10,-2.4,34.82,35.18),
(0,2.4,10,34.82,35.18),
(0,15.82,36.18,16.82,17.18),
(0,15.82,16.18,17,35),
(0,35.82,36.18,17,35),
(0,16,23.6,34.82,35.18),
(0,28.4,36,34.82,35.18),
(1,-36.18,-15.82,-35.18,-34.82),
(1,-36.18,-35.82,-35,-17),
(1,-16.18,-15.82,-35,-17),
(1,-36,-28.4,-17.18,-16.82),
(1,-23.6,-16,-17.18,-16.82),
(1,-10.18,10.18,-35.18,-34.82),
(1,-10.18,-9.82,-35,-17),
(1,9.82,10.18,-35,-17),
(1,-10,-2.4,-17.18,-16.82),
(1,2.4,10,-17.18,-16.82),
(1,15.82,36.18,-35.18,-34.82),
(1,15.82,16.18,-35,-17),
(1,35.82,36.18,-35,-17),
(1,16,23.6,-17.18,-16.82),
(1,28.4,36,-17.18,-16.82),
(1,-62.18,-41.82,-9.18,-8.82),
(1,-62.18,-61.82,-9,9),
(1,-42.18,-41.82,-9,9),
(1,-62,-54.4,8.82,9.18),
(1,-49.6,-42,8.82,9.18),
(1,41.82,62.18,-9.18,-8.82),
(1,41.82,42.18,-9,9),
(1,61.82,62.18,-9,9),
(1,42,49.6,8.82,9.18),
(1,54.4,62,8.82,9.18),
(1,15.82,36.18,16.82,17.18),
(1,15.82,16.18,17,35),
(1,35.82,36.18,17,35),
(1,16,23.6,34.82,35.18),
(1,28.4,36,34.82,35.18),
(2,-36.18,-15.82,-35.18,-34.82),
(2,-36.18,-35.82,-35,-17),
(2,-16.18,-15.82,-35,-17),
(2,-36,-28.4,-17.18,-16.82),
(2,-23.6,-16,-17.18,-16.82),
(2,-10.18,10.18,-35.18,-34.82),
(2,-10.18,-9.82,-35,-17),
(2,9.82,10.18,-35,-17),
(2,-10,-2.4,-17.18,-16.82),
(2,2.4,10,-17.18,-16.82),
(2,15.82,36.18,-35.18,-34.82),
(2,15.82,16.18,-35,-17),
(2,35.82,36.18,-35,-17),
(2,16,23.6,-17.18,-16.82),
(2,28.4,36,-17.18,-16.82),
(2,-62.18,-41.82,-9.18,-8.82),
(2,-62.18,-61.82,-9,9),
(2,-42.18,-41.82,-9,9),
(2,-62,-54.4,8.82,9.18),
(2,-49.6,-42,8.82,9.18),
(2,15.82,36.18,16.82,17.18),
(2,15.82,16.18,17,35),
(2,35.82,36.18,17,35),
(2,16,23.6,34.82,35.18),
(2,28.4,36,34.82,35.18),
(0,-58.5,-55.5,-25.55,-24.45),
(0,-58.5,-55.5,-24.575,-24.425),
(0,-48.5,-45.5,-25.55,-24.45),
(0,-48.5,-45.5,-24.575,-24.425),
(0,-33,-31,-29.07,-28.93),
(0,-32.8,-32,-28.915,-28.884999999999998),
(0,-31.900000000000002,-31.3,-28.895,-28.865),
(0,-33,-31,-23.07,-22.93),
(0,-32.8,-32,-22.915,-22.884999999999998),
(0,-31.900000000000002,-31.3,-22.895,-22.865),
(0,-27,-25,-29.07,-28.93),
(0,-26.799999999999997,-26,-28.915,-28.884999999999998),
(0,-25.900000000000002,-25.3,-28.895,-28.865),
(0,-27,-25,-23.07,-22.93),
(0,-26.799999999999997,-26,-22.915,-22.884999999999998),
(0,-25.900000000000002,-25.3,-22.895,-22.865),
(0,-21,-19,-29.07,-28.93),
(0,-20.799999999999997,-20,-28.915,-28.884999999999998),
(0,-19.900000000000002,-19.3,-28.895,-28.865),
(0,-21,-19,-23.07,-22.93),
(0,-20.799999999999997,-20,-22.915,-22.884999999999998),
(0,-19.900000000000002,-19.3,-22.895,-22.865),
(0,-30,-22,-20.75,-19.25),
(0,-4.5,4.5,-34.77,-34.63),
(0,-4.7,4.7,-34.75,-34.25),
(0,-7.2,-4.8,-26.6,-25.4),
(0,-6.39,-5.61,-25.44,-24.66),
(0,-7.2,-4.8,-22.6,-21.4),
(0,-6.39,-5.61,-21.44,-20.66),
(0,-3.2,-0.8,-26.6,-25.4),
(0,-2.39,-1.6099999999999999,-25.44,-24.66),
(0,-3.2,-0.8,-22.6,-21.4),
(0,-2.39,-1.6099999999999999,-21.44,-20.66),
(0,0.8,3.2,-26.6,-25.4),
(0,1.6099999999999999,2.39,-25.44,-24.66),
(0,0.8,3.2,-22.6,-21.4),
(0,1.6099999999999999,2.39,-21.44,-20.66),
(0,4.8,7.2,-26.6,-25.4),
(0,5.61,6.39,-25.44,-24.66),
(0,4.8,7.2,-22.6,-21.4),
(0,5.61,6.39,-21.44,-20.66),
(0,-7.5,-4.5,-31.8,-30.2),
(0,-6.39,-5.61,-32.69,-31.909999999999997),
(0,18.2,21.8,-29.35,-28.65),
(0,19.61,20.39,-28.39,-27.61),
(0,18.2,21.8,-22.35,-21.65),
(0,19.61,20.39,-21.39,-20.61),
(0,29.2,32.8,-29.35,-28.65),
(0,30.61,31.39,-28.39,-27.61),
(0,29.2,32.8,-22.35,-21.65),
(0,30.61,31.39,-21.39,-20.61),
(0,45.5,48.5,-25.55,-24.45),
(0,45.5,48.5,-24.575,-24.425),
(0,55.5,58.5,-25.55,-24.45),
(0,55.5,58.5,-24.575,-24.425),
(0,-57.5,-46.5,-8.65,-8.549999999999999),
(0,-54.09,-53.31,-1.3900000000000001,-0.61),
(0,-54.09,-53.31,-0.73,-0.6099999999999999),
(0,-55.99,-55.21,-1.3900000000000001,-0.61),
(0,-55.99,-55.21,-0.73,-0.6099999999999999),
(0,-57.89,-57.11,-1.3900000000000001,-0.61),
(0,-57.89,-57.11,-0.73,-0.6099999999999999),
(0,-59.79,-59.01,-1.3900000000000001,-0.61),
(0,-59.79,-59.01,-0.73,-0.6099999999999999),
(0,-50.69,-49.91,-1.3900000000000001,-0.61),
(0,-50.69,-49.91,-0.73,-0.6099999999999999),
(0,-48.79,-48.01,-1.3900000000000001,-0.61),
(0,-48.79,-48.01,-0.73,-0.6099999999999999),
(0,-46.89,-46.11,-1.3900000000000001,-0.61),
(0,-46.89,-46.11,-0.73,-0.6099999999999999),
(0,-44.99,-44.21,-1.3900000000000001,-0.61),
(0,-44.99,-44.21,-0.73,-0.6099999999999999),
(0,-54.09,-53.31,0.61,1.3900000000000001),
(0,-55.99,-55.21,0.61,1.3900000000000001),
(0,-57.89,-57.11,0.61,1.3900000000000001),
(0,-59.79,-59.01,0.61,1.3900000000000001),
(0,-50.69,-49.91,0.61,1.3900000000000001),
(0,-48.79,-48.01,0.61,1.3900000000000001),
(0,-46.89,-46.11,0.61,1.3900000000000001),
(0,-44.99,-44.21,0.61,1.3900000000000001),
(0,-54.09,-53.31,2.61,3.39),
(0,-55.99,-55.21,2.61,3.39),
(0,-57.89,-57.11,2.61,3.39),
(0,-59.79,-59.01,2.61,3.39),
(0,-50.69,-49.91,2.61,3.39),
(0,-48.79,-48.01,2.61,3.39),
(0,-46.89,-46.11,2.61,3.39),
(0,-44.99,-44.21,2.61,3.39),
(0,-54.09,-53.31,4.61,5.39),
(0,-55.99,-55.21,4.61,5.39),
(0,-57.89,-57.11,4.61,5.39),
(0,-59.79,-59.01,4.61,5.39),
(0,-50.69,-49.91,4.61,5.39),
(0,-48.79,-48.01,4.61,5.39),
(0,-46.89,-46.11,4.61,5.39),
(0,-44.99,-44.21,4.61,5.39),
(0,-57.7,-56.3,-5.5,-4.5),
(0,-30.5,-21.5,-8.77,-8.629999999999999),
(0,-30.7,-21.3,-8.75,-8.25),
(0,-33.3,-28.7,-4,-2),
(0,-31.39,-30.61,-1.9900000000000002,-1.21),
(0,-33.3,-28.7,2,4),
(0,-31.39,-30.61,4.010000000000001,4.79),
(0,-23.3,-18.7,-4,-2),
(0,-21.39,-20.61,-1.9900000000000002,-1.21),
(0,-23.3,-18.7,2,4),
(0,-21.39,-20.61,4.010000000000001,4.79),
(0,-9.1,-5.300000000000001,-6.75,-5.85),
(0,5.300000000000001,9.1,-6.75,-5.85),
(0,21.5,30.5,-8.77,-8.629999999999999),
(0,21.3,30.7,-8.75,-8.25),
(0,18,22,3.3,4.7),
(0,19.61,20.39,4.8100000000000005,5.59),
(0,30,34,3.3,4.7),
(0,31.61,32.39,4.8100000000000005,5.59),
(0,50.75,53.25,-7.075,-6.925),
(0,50.75,53.25,6.925,7.075),
(0,-53.25,-50.75,18.925,19.075),
(0,-53.25,-50.75,32.925,33.075),
(0,-30.5,-21.5,17.23,17.37),
(0,-30.7,-21.3,17.25,17.75),
(0,-33.2,-30.8,25.4,26.6),
(0,-32.39,-31.61,26.56,27.34),
(0,-33.2,-30.8,29.4,30.6),
(0,-32.39,-31.61,30.56,31.34),
(0,-29.2,-26.8,25.4,26.6),
(0,-28.39,-27.61,26.56,27.34),
(0,-29.2,-26.8,29.4,30.6),
(0,-28.39,-27.61,30.56,31.34),
(0,-25.2,-22.8,25.4,26.6),
(0,-24.39,-23.61,26.56,27.34),
(0,-25.2,-22.8,29.4,30.6),
(0,-24.39,-23.61,30.56,31.34),
(0,-21.2,-18.8,25.4,26.6),
(0,-20.39,-19.61,26.56,27.34),
(0,-21.2,-18.8,29.4,30.6),
(0,-20.39,-19.61,30.56,31.34),
(0,-33.5,-30.5,20.2,21.8),
(0,-32.39,-31.61,19.31,20.09),
(0,-7.65,1.6500000000000004,21.85,24.15),
(0,-6.39,-5.61,29.61,30.39),
(0,-3.39,-2.61,29.61,30.39),
(0,2.61,3.39,29.61,30.39),
(0,5.61,6.39,29.61,30.39),
(0,4,8,19.425,19.575),
(0,17.3,34.7,17.85,20.15),
(0,19,23,24.1,25.9),
(0,19.509999999999998,20.29,23.11,23.89),
(0,21.71,22.490000000000002,23.11,23.89),
(0,19.509999999999998,20.29,26.11,26.89),
(0,21.71,22.490000000000002,26.11,26.89),
(0,19,23,29.1,30.9),
(0,19.509999999999998,20.29,28.11,28.89),
(0,21.71,22.490000000000002,28.11,28.89),
(0,19.509999999999998,20.29,31.11,31.89),
(0,21.71,22.490000000000002,31.11,31.89),
(0,29,33,24.1,25.9),
(0,29.509999999999998,30.29,23.11,23.89),
(0,31.71,32.49,23.11,23.89),
(0,29.509999999999998,30.29,26.11,26.89),
(0,31.71,32.49,26.11,26.89),
(0,29,33,29.1,30.9),
(0,29.509999999999998,30.29,28.11,28.89),
(0,31.71,32.49,28.11,28.89),
(0,29.509999999999998,30.29,31.11,31.89),
(0,31.71,32.49,31.11,31.89),
(0,17.75,22.25,17.36,17.439999999999998),
(0,23.75,28.25,17.36,17.439999999999998),
(0,29.75,34.25,17.36,17.439999999999998),
(0,45.5,48.5,26.45,27.55),
(0,45.5,48.5,27.425,27.575),
(0,55.5,58.5,26.45,27.55),
(0,55.5,58.5,27.425,27.575),
(0,50.25,53.75,20.25,23.75),
(1,-30.5,-21.5,-34.77,-34.63),
(1,-30.7,-21.3,-34.75,-34.25),
(1,-33.2,-30.8,-26.6,-25.4),
(1,-32.39,-31.61,-25.44,-24.66),
(1,-33.2,-30.8,-22.6,-21.4),
(1,-32.39,-31.61,-21.44,-20.66),
(1,-29.2,-26.8,-26.6,-25.4),
(1,-28.39,-27.61,-25.44,-24.66),
(1,-29.2,-26.8,-22.6,-21.4),
(1,-28.39,-27.61,-21.44,-20.66),
(1,-25.2,-22.8,-26.6,-25.4),
(1,-24.39,-23.61,-25.44,-24.66),
(1,-25.2,-22.8,-22.6,-21.4),
(1,-24.39,-23.61,-21.44,-20.66),
(1,-21.2,-18.8,-26.6,-25.4),
(1,-20.39,-19.61,-25.44,-24.66),
(1,-21.2,-18.8,-22.6,-21.4),
(1,-20.39,-19.61,-21.44,-20.66),
(1,-33.5,-30.5,-31.8,-30.2),
(1,-32.39,-31.61,-32.69,-31.909999999999997),
(1,-4.5,4.5,-34.77,-34.63),
(1,-4.7,4.7,-34.75,-34.25),
(1,-7.3,-2.7,-30,-28),
(1,-5.39,-4.61,-27.990000000000002,-27.21),
(1,-7.3,-2.7,-24,-22),
(1,-5.39,-4.61,-21.990000000000002,-21.21),
(1,2.7,7.3,-30,-28),
(1,4.61,5.39,-27.990000000000002,-27.21),
(1,2.7,7.3,-24,-22),
(1,4.61,5.39,-21.990000000000002,-21.21),
(1,18.8,21.2,-31.15,-28.85),
(1,18.8,21.2,-24.15,-21.85),
(1,30.8,33.2,-31.15,-28.85),
(1,30.8,33.2,-24.15,-21.85),
(1,-56.5,-47.5,-8.77,-8.629999999999999),
(1,-56.7,-47.3,-8.75,-8.25),
(1,-59.2,-56.8,-0.6,0.6),
(1,-58.39,-57.61,0.5599999999999999,1.3399999999999999),
(1,-58.39,-57.61,1.22,1.34),
(1,-59.2,-56.8,3.4,4.6),
(1,-58.39,-57.61,4.5600000000000005,5.34),
(1,-55.2,-52.8,-0.6,0.6),
(1,-54.39,-53.61,0.5599999999999999,1.3399999999999999),
(1,-54.39,-53.61,1.22,1.34),
(1,-55.2,-52.8,3.4,4.6),
(1,-54.39,-53.61,4.5600000000000005,5.34),
(1,-51.2,-48.8,-0.6,0.6),
(1,-50.39,-49.61,0.5599999999999999,1.3399999999999999),
(1,-50.39,-49.61,1.22,1.34),
(1,-51.2,-48.8,3.4,4.6),
(1,-50.39,-49.61,4.5600000000000005,5.34),
(1,-47.2,-44.8,-0.6,0.6),
(1,-46.39,-45.61,0.5599999999999999,1.3399999999999999),
(1,-46.39,-45.61,1.22,1.34),
(1,-47.2,-44.8,3.4,4.6),
(1,-46.39,-45.61,4.5600000000000005,5.34),
(1,-59.5,-56.5,-5.8,-4.2),
(1,-58.39,-57.61,-6.6899999999999995,-5.91),
(1,47.5,56.5,-8.77,-8.629999999999999),
(1,47.3,56.7,-8.75,-8.25),
(1,44,48,3.3,4.7),
(1,45.61,46.39,4.8100000000000005,5.59),
(1,56,60,3.3,4.7),
(1,57.61,58.39,4.8100000000000005,5.59),
(1,18.8,21.2,20.85,23.15),
(1,18.8,21.2,27.85,30.15),
(1,30.8,33.2,20.85,23.15),
(1,30.8,33.2,27.85,30.15),
(2,-30.5,-21.5,-34.77,-34.63),
(2,-30.7,-21.3,-34.75,-34.25),
(2,-33.2,-30.8,-26.6,-25.4),
(2,-32.39,-31.61,-25.44,-24.66),
(2,-33.2,-30.8,-22.6,-21.4),
(2,-32.39,-31.61,-21.44,-20.66),
(2,-29.2,-26.8,-26.6,-25.4),
(2,-28.39,-27.61,-25.44,-24.66),
(2,-29.2,-26.8,-22.6,-21.4),
(2,-28.39,-27.61,-21.44,-20.66),
(2,-25.2,-22.8,-26.6,-25.4),
(2,-24.39,-23.61,-25.44,-24.66),
(2,-25.2,-22.8,-22.6,-21.4),
(2,-24.39,-23.61,-21.44,-20.66),
(2,-21.2,-18.8,-26.6,-25.4),
(2,-20.39,-19.61,-25.44,-24.66),
(2,-21.2,-18.8,-22.6,-21.4),
(2,-20.39,-19.61,-21.44,-20.66),
(2,-33.5,-30.5,-31.8,-30.2),
(2,-32.39,-31.61,-32.69,-31.909999999999997),
(2,-4.5,4.5,-34.77,-34.63),
(2,-4.7,4.7,-34.75,-34.25),
(2,-7.3,-2.7,-30,-28),
(2,-5.39,-4.61,-27.990000000000002,-27.21),
(2,-7.3,-2.7,-24,-22),
(2,-5.39,-4.61,-21.990000000000002,-21.21),
(2,2.7,7.3,-30,-28),
(2,4.61,5.39,-27.990000000000002,-27.21),
(2,2.7,7.3,-24,-22),
(2,4.61,5.39,-21.990000000000002,-21.21),
(2,18.8,21.2,-31.15,-28.85),
(2,18.8,21.2,-24.15,-21.85),
(2,30.8,33.2,-31.15,-28.85),
(2,30.8,33.2,-24.15,-21.85),
(2,-59,-57,-4.6,-4.4),
(2,-53,-51,-4.6,-4.4),
(2,-47,-45,-4.6,-4.4),
(2,45.5,48.5,0.44999999999999996,1.55),
(2,45.5,48.5,1.425,1.575),
(2,55.5,58.5,0.44999999999999996,1.55),
(2,55.5,58.5,1.425,1.575),
(2,18.8,21.2,20.85,23.15),
(2,18.8,21.2,27.85,30.15),
(2,30.8,33.2,20.85,23.15),
(2,30.8,33.2,27.85,30.15),
(0,-5.65,-3.35,-4.3500000000000005,-3.0500000000000003),
(0,-4.9,-4.1,-3.4,-2.6),
(0,-4.9,-4.1,-2.68,-2.56),
(0,-2.65,-0.3500000000000001,-4.3500000000000005,-3.0500000000000003),
(0,-1.9,-1.1,-3.4,-2.6),
(0,-1.9,-1.1,-2.68,-2.56),
(0,0.3500000000000001,2.65,-4.3500000000000005,-3.0500000000000003),
(0,1.1,1.9,-3.4,-2.6),
(0,1.1,1.9,-2.68,-2.56),
(0,3.35,5.65,-4.3500000000000005,-3.0500000000000003),
(0,4.1,4.9,-3.4,-2.6),
(0,4.1,4.9,-2.68,-2.56),
(0,20.35,22.65,-4.3500000000000005,-3.0500000000000003),
(0,21.1,21.9,-3.4,-2.6),
(0,21.1,21.9,-2.68,-2.56),
(0,23.35,25.65,-4.3500000000000005,-3.0500000000000003),
(0,24.1,24.9,-3.4,-2.6),
(0,24.1,24.9,-2.68,-2.56),
(0,26.35,28.65,-4.3500000000000005,-3.0500000000000003),
(0,27.1,27.9,-3.4,-2.6),
(0,27.1,27.9,-2.68,-2.56),
(0,29.35,31.65,-4.3500000000000005,-3.0500000000000003),
(0,30.1,30.9,-3.4,-2.6),
(0,30.1,30.9,-2.68,-2.56),
(0,-4.15,-1.85,-30.349999999999998,-29.05),
(0,-3.4,-2.6,-29.4,-28.6),
(0,-3.4,-2.6,-28.68,-28.560000000000002),
(0,1.85,4.15,-30.349999999999998,-29.05),
(0,2.6,3.4,-29.4,-28.6),
(0,2.6,3.4,-28.68,-28.560000000000002),
(1,-30.15,-27.85,-30.349999999999998,-29.05),
(1,-29.4,-28.6,-29.4,-28.6),
(1,-29.4,-28.6,-28.68,-28.560000000000002),
(1,-24.15,-21.85,-30.349999999999998,-29.05),
(1,-23.4,-22.6,-29.4,-28.6),
(1,-23.4,-22.6,-28.68,-28.560000000000002),
(1,-56.15,-53.85,-4.3500000000000005,-3.0500000000000003),
(1,-55.4,-54.6,-3.4,-2.6),
(1,-55.4,-54.6,-2.68,-2.56),
(1,-50.15,-47.85,-4.3500000000000005,-3.0500000000000003),
(1,-49.4,-48.6,-3.4,-2.6),
(1,-49.4,-48.6,-2.68,-2.56),
(1,47.85,50.15,-4.3500000000000005,-3.0500000000000003),
(1,48.6,49.4,-3.4,-2.6),
(1,48.6,49.4,-2.68,-2.56),
(1,53.85,56.15,-4.3500000000000005,-3.0500000000000003),
(1,54.6,55.4,-3.4,-2.6),
(1,54.6,55.4,-2.68,-2.56),
(2,-30.15,-27.85,-30.349999999999998,-29.05),
(2,-29.4,-28.6,-29.4,-28.6),
(2,-29.4,-28.6,-28.68,-28.560000000000002),
(2,-24.15,-21.85,-30.349999999999998,-29.05),
(2,-23.4,-22.6,-29.4,-28.6),
(2,-23.4,-22.6,-28.68,-28.560000000000002),
(2,21.85,24.15,-30.349999999999998,-29.05),
(2,22.6,23.4,-29.4,-28.6),
(2,22.6,23.4,-28.68,-28.560000000000002),
(2,27.85,30.15,-30.349999999999998,-29.05),
(2,28.6,29.4,-29.4,-28.6),
(2,28.6,29.4,-28.68,-28.560000000000002),
(0,-58.85,-57.15,-31.85,-30.15),
(0,-58.85,-57.15,-21.85,-20.15),
(0,-46.85,-45.15,-31.85,-30.15),
(0,-46.85,-45.15,-21.85,-20.15),
(0,45.45,46.55,-31.55,-30.45),
(0,45.45,46.55,-21.55,-20.45),
(0,57.45,58.55,-31.55,-30.45),
(0,57.45,58.55,-21.55,-20.45),
(0,-8,-7.199999999999999,2.6,3.4),
(0,-8,-7.199999999999999,5.6,6.4),
(0,7.199999999999999,8,2.6,3.4),
(0,7.199999999999999,8,5.6,6.4),
(0,45.45,46.55,20.45,21.55),
(0,45.45,46.55,30.45,31.55),
(0,57.45,58.55,20.45,21.55),
(0,57.45,58.55,30.45,31.55),
(1,19.5,20.5,-33.5,-32.5),
(1,31.5,32.5,-33.5,-32.5),
(1,19.5,20.5,18.5,19.5),
(1,31.5,32.5,18.5,19.5),
(2,19.5,20.5,-33.5,-32.5),
(2,31.5,32.5,-33.5,-32.5),
(2,45.15,46.85,-5.85,-4.15),
(2,45.15,46.85,4.15,5.85),
(2,57.15,58.85,-5.85,-4.15),
(2,57.15,58.85,4.15,5.85),
(2,19.5,20.5,18.5,19.5),
(2,31.5,32.5,18.5,19.5),
(0,-63.85,-62.15,-37.85,-36.15),
(0,-63.85,-62.15,-20.85,-19.15),
(0,-63.85,-62.15,-7.85,-6.15),
(0,-63.85,-62.15,16.15,17.85),
(0,-63.85,-62.15,37.15,38.85),
(0,62.15,63.85,-37.85,-36.15),
(0,62.15,63.85,-20.85,-19.15),
(0,62.15,63.85,-7.85,-6.15),
(0,62.15,63.85,16.15,17.85),
(0,62.15,63.85,37.15,38.85),
(0,37.5,40.5,-12.4,12.4),
(0,-40.2,-37.8,14,38),
(0,-14.7,-11.3,37.2,40.8),
(1,37.5,40.5,-12.4,12.4),
(1,-40.2,-37.8,14,38),
(1,-14.7,-11.3,37.2,40.8),
(2,37.5,40.5,-12.4,12.4),
(2,-40.2,-37.8,14,38),
(2,-14.7,-11.3,37.2,40.8);
CREATE INDEX campus_school_solids_floor ON public.campus_school_solids(floor);
ALTER TABLE public.campus_school_solids ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.campus_school_solids FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.campus_school_solids TO service_role;
CREATE FUNCTION public.campus_school_walkable(px double precision,pz double precision,level integer,radius double precision) RETURNS boolean LANGUAGE sql STABLE SET search_path=public,pg_temp AS $$
 SELECT level BETWEEN 0 AND 2 AND px BETWEEN -64 AND 64 AND pz BETWEEN -39 AND 42 AND NOT(level>0 AND (px< -64+greatest(.5,radius+.07) OR px>64-greatest(.5,radius+.07) OR pz< -39+greatest(.5,radius+.07) OR pz>42-greatest(.5,radius+.07))) AND NOT(level>0 AND px> -26-greatest(.5,radius+.07) AND px<26+greatest(.5,radius+.07) AND pz>3-greatest(.5,radius+.07) AND pz<22+greatest(.5,radius+.07)) AND NOT EXISTS(SELECT 1 FROM campus_school_solids s WHERE s.floor=level AND px>s.min_x-radius AND px<s.max_x+radius AND pz>s.min_z-radius AND pz<s.max_z+radius);
$$;
CREATE FUNCTION public.campus_school_walkable(px double precision,pz double precision,level integer) RETURNS boolean LANGUAGE sql STABLE SET search_path=public,pg_temp AS $$ SELECT public.campus_school_walkable(px,pz,level,.34); $$;
CREATE OR REPLACE FUNCTION public.campus_school_walkable(px double precision,pz double precision) RETURNS boolean LANGUAGE sql STABLE SET search_path=public,pg_temp AS $$ SELECT public.campus_school_walkable(px,pz,0); $$;
CREATE FUNCTION public.campus_school_walk(from_x double precision,from_z double precision,dx double precision,dz double precision,seconds double precision,level integer,posture text,sprint boolean)
RETURNS TABLE(x double precision,z double precision) LANGUAGE plpgsql STABLE SET search_path=public,pg_temp AS $$
DECLARE duration double precision:=least(.35,greatest(0,seconds));steps integer;n integer;sx double precision;sz double precision;nx double precision;nz double precision;divisor double precision:=greatest(1,sqrt(dx*dx+dz*dz));speed double precision:=CASE WHEN posture='prone' THEN .8 WHEN posture='crouch' THEN 1.45 WHEN sprint THEN 5.5 ELSE 3 END;
BEGIN x:=from_x;z:=from_z;steps:=greatest(1,ceil(duration/.05)::integer);sx:=dx/divisor*speed*duration/steps;sz:=dz/divisor*speed*duration/steps;
 FOR n IN 1..steps LOOP nx:=greatest(-64,least(64,x+sx));IF public.campus_school_walkable(nx,z,level,CASE WHEN posture='prone' THEN .9 ELSE .34 END) THEN x:=nx;END IF;nz:=greatest(-39,least(42,z+sz));IF public.campus_school_walkable(x,nz,level,CASE WHEN posture='prone' THEN .9 ELSE .34 END) THEN z:=nz;END IF;END LOOP;RETURN NEXT;END;$$;
CREATE OR REPLACE FUNCTION public.campus_school_walk(from_x double precision,from_z double precision,dx double precision,dz double precision,seconds double precision) RETURNS TABLE(x double precision,z double precision) LANGUAGE sql STABLE SET search_path=public,pg_temp AS $$ SELECT * FROM public.campus_school_walk(from_x,from_z,dx,dz,seconds,0,'stand',false); $$;
REVOKE ALL ON FUNCTION public.campus_school_walkable(double precision,double precision,integer,double precision),public.campus_school_walkable(double precision,double precision,integer),public.campus_school_walk(double precision,double precision,double precision,double precision,double precision,integer,text,boolean) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.campus_school_walkable(double precision,double precision,integer,double precision),public.campus_school_walkable(double precision,double precision,integer),public.campus_school_walk(double precision,double precision,double precision,double precision,double precision,integer,text,boolean) TO service_role;
CREATE OR REPLACE FUNCTION public.campus_runtime_school(
 runtime_connection uuid,
 runtime_operation text,
 runtime_commands jsonb DEFAULT '[]'::jsonb,
 ticket_hash text DEFAULT NULL,
 expected_campus uuid DEFAULT NULL,
 runtime_renew boolean DEFAULT false
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE
 at_time timestamptz;
 identity jsonb;
 own uuid;
 member_user uuid;
 player campus_presence;
 command jsonb;
 value jsonb;
 command_type text;
 command_count integer;
 n integer;
 input_seq bigint;
 dx double precision;
 dz double precision;
 seat_x double precision;
 seat_z double precision;
 seat_id text;
 notice text;
 snapshot jsonb;
 config jsonb;target_floor integer;reverse_trip boolean;start_x double precision;start_z double precision;end_x double precision;end_z double precision;
BEGIN
 IF runtime_connection IS NULL OR runtime_operation IS NULL OR runtime_operation NOT IN ('connect','step','leave') THEN
  RETURN jsonb_build_object('ended',true);
 END IF;
 IF jsonb_typeof(runtime_commands) IS DISTINCT FROM 'array' OR jsonb_array_length(runtime_commands)>5 THEN
  RETURN jsonb_build_object('ended',true);
 END IF;
 -- Admission takes the member lock first, matching ticket issuance/upgrade claims.
 -- Otherwise its FK insert could wait on an issuer that is waiting for its ticket.
 IF runtime_operation='connect' THEN
  IF ticket_hash IS NULL OR ticket_hash !~ '^[0-9a-f]{64}$' OR expected_campus IS NULL THEN
   RETURN jsonb_build_object('ended',true);
  END IF;
  PERFORM 1 FROM campus_members WHERE campus_id=expected_campus FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('ended',true); END IF;
 END IF;
 -- Bounded lock waits are configured below. Read clock time AFTER acquiring the
 -- library lock so queued transactions cannot move the simulation backwards.
 PERFORM 1 FROM campus_runtime_lock WHERE room='library' FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Campus runtime unavailable'; END IF;
 at_time := clock_timestamp();
 DELETE FROM campus_presence p WHERE lease_until<=at_time OR NOT public.campus_allowed(p.campus_id)
  OR EXISTS(SELECT 1 FROM campus_members m WHERE m.campus_id=p.campus_id AND m.pseudonym !~ '^[A-Za-z]+ [A-Za-z]+ [0-9a-f]{6}$');

 UPDATE campus_focus_glass SET frosted='{}' WHERE NOT EXISTS(SELECT 1 FROM campus_presence);
 IF runtime_operation='connect' THEN
  IF NOT EXISTS(SELECT 1 FROM campus_tickets t WHERE t.token_hash=ticket_hash AND t.handshake_started_at IS NOT NULL) THEN
   RETURN jsonb_build_object('ended',true);
  END IF;
  identity := public.campus_redeem_ticket(ticket_hash);
  IF identity IS NULL OR (identity->>'id')::uuid<>expected_campus
   OR identity->>'pseudonym' !~ '^[A-Za-z]+ [A-Za-z]+ [0-9a-f]{6}$' THEN
   RETURN jsonb_build_object('ended',true);
  END IF;
  own := expected_campus;
  SELECT * INTO player FROM campus_presence WHERE campus_id=own;
  IF FOUND THEN
   IF runtime_renew IS NOT TRUE OR player.opened_at>at_time-interval '180 seconds' THEN
    RETURN jsonb_build_object('error','Already connected in another tab.');
   END IF;
   -- A fresh, account-bound ticket transfers authority near the duration limit.
   -- Position/seat/coarse status survive; the old connection can no longer act or delete this row.
   UPDATE campus_presence SET connection_id=runtime_connection,opened_at=at_time,
    input_x=0,input_z=0,input_at=at_time,simulated_at=at_time,sequence=-1,
    lease_until=at_time+interval '15 seconds',rate_at=at_time,rate_count=0 WHERE campus_id=own;
  ELSE
   IF runtime_renew IS TRUE THEN RETURN jsonb_build_object('ended',true); END IF;
   SELECT count(*) INTO n FROM campus_presence;
   IF n>=10 THEN RETURN jsonb_build_object('error','The library is full. Please try again later.'); END IF;
   INSERT INTO campus_presence(campus_id,connection_id,opened_at,x,z,input_at,simulated_at,lease_until,rate_at)
    VALUES(own,runtime_connection,at_time,(n%5)-2,4,at_time,at_time,at_time+interval '15 seconds',at_time);
  END IF;
 ELSE
  SELECT * INTO player FROM campus_presence WHERE connection_id=runtime_connection;
  IF NOT FOUND THEN RETURN jsonb_build_object('ended',true); END IF;
  own := player.campus_id;
  IF runtime_operation='leave' THEN
   DELETE FROM campus_presence WHERE connection_id=runtime_connection;
   RETURN jsonb_build_object('ended',true);
  END IF;
 END IF;

 -- Server-owned transport trajectories and bounded jumps use database time.
 WITH trips AS (SELECT campus_id,travel,greatest(0,least(1,(extract(epoch FROM at_time)*1000-(travel->>'at')::double precision)/(travel->>'duration')::double precision)) t FROM campus_presence WHERE travel IS NOT NULL),
 ride_time AS(SELECT *,CASE WHEN travel->>'via'='lift' THEN greatest(0,least(1,(t-.1)/.8)) ELSE t END AS u FROM trips),
 positions AS(SELECT *,u*u*(3-2*u) AS v FROM ride_time)
 UPDATE campus_presence p SET x=CASE WHEN q.travel->>'via'='lift' THEN CASE WHEN t<.1 THEN (q.travel->>'x')::double precision+((q.travel->>'shaftX')::double precision-(q.travel->>'x')::double precision)*t/.1 WHEN t>.9 THEN (q.travel->>'shaftX')::double precision+((q.travel->>'endX')::double precision-(q.travel->>'shaftX')::double precision)*(t-.9)/.1 ELSE (q.travel->>'shaftX')::double precision END ELSE (q.travel->>'x')::double precision+((q.travel->>'endX')::double precision-(q.travel->>'x')::double precision)*v END,
 z=(q.travel->>'z')::double precision+((q.travel->>'endZ')::double precision-(q.travel->>'z')::double precision)*v,
 elevation=(q.travel->>'from')::integer*12+((q.travel->>'to')::integer-(q.travel->>'from')::integer)*12*v,
 floor=CASE WHEN t=1 THEN (q.travel->>'to')::integer ELSE p.floor END,
 stance=CASE WHEN q.travel->>'via'='slide' AND t<1 THEN 'crouch' ELSE 'stand' END,
 travel=CASE WHEN t=1 THEN NULL ELSE q.travel END,simulated_at=at_time
 FROM positions q WHERE p.campus_id=q.campus_id;
 UPDATE campus_presence SET elevation=floor*12+CASE WHEN jump_at IS NOT NULL AND at_time>=jump_at AND at_time<jump_at+interval '850 milliseconds' THEN sin(pi()*extract(epoch FROM at_time-jump_at)/.85)*1.2 ELSE 0 END WHERE travel IS NULL;
 -- Integrate only the portion of the last accepted input that is still fresh.
 -- Speed is 3 units/sec, diagonals normalize, bounds and the 350ms stop are global.
 WITH movement AS (
  SELECT campus_id,x,z,input_x,input_z,floor,stance,input_run,
   greatest(0,extract(epoch FROM (least(at_time,input_at+interval '350 milliseconds')-simulated_at))) AS seconds
  FROM campus_presence WHERE status='walking' AND travel IS NULL AND (input_x<>0 OR input_z<>0)
   AND simulated_at<least(at_time,input_at+interval '350 milliseconds')
 )
 UPDATE campus_presence p SET x=walk.x,z=walk.z,
  rotation=atan2(p.input_x,p.input_z),simulated_at=at_time
 FROM movement m CROSS JOIN LATERAL public.campus_school_walk(m.x,m.z,m.input_x,m.input_z,m.seconds::double precision,m.floor,m.stance,m.input_run) walk
 WHERE p.campus_id=m.campus_id;

 SELECT * INTO player FROM campus_presence WHERE campus_id=own;
 command_count := jsonb_array_length(runtime_commands);
 IF at_time-player.rate_at>=interval '1 second' THEN
  player.rate_at:=at_time; player.rate_count:=0;
 END IF;
 IF player.rate_count+command_count<=30 THEN
  FOR command IN SELECT jsonb_array_elements(runtime_commands) LOOP
   player.rate_count:=player.rate_count+1;
   IF jsonb_typeof(command) IS DISTINCT FROM 'object' THEN CONTINUE; END IF;
   SELECT count(*) INTO n FROM jsonb_object_keys(command);
   IF n<>2 OR NOT(command ? 'type' AND command ? 'data') THEN CONTINUE; END IF;
   command_type:=command->>'type'; value:=command->'data';
   IF command_type='input' AND player.status='walking' AND player.travel IS NULL AND jsonb_typeof(value)='object' THEN
    SELECT count(*) INTO n FROM jsonb_object_keys(value);
    IF n<3 OR n>6 OR EXISTS(SELECT 1 FROM jsonb_object_keys(value) k WHERE k NOT IN ('x','z','seq','run','jump','stance')) OR NOT(value ? 'x' AND value ? 'z' AND value ? 'seq')
     OR (value ? 'run' AND jsonb_typeof(value->'run') IS DISTINCT FROM 'boolean') OR (value ? 'jump' AND jsonb_typeof(value->'jump') IS DISTINCT FROM 'boolean')
     OR (value ? 'stance' AND (jsonb_typeof(value->'stance') IS DISTINCT FROM 'string' OR value->>'stance' NOT IN ('stand','crouch','prone')))
     OR jsonb_typeof(value->'x') IS DISTINCT FROM 'number' OR jsonb_typeof(value->'z') IS DISTINCT FROM 'number'
     OR jsonb_typeof(value->'seq') IS DISTINCT FROM 'number' THEN CONTINUE; END IF;
    -- Numeric validation precedes casts, including the JS safe-integer limit.
    IF abs((value->>'x')::numeric)>1 OR abs((value->>'z')::numeric)>1
     OR (value->>'seq')::numeric<0 OR (value->>'seq')::numeric>9007199254740991
     OR trunc((value->>'seq')::numeric)<>(value->>'seq')::numeric THEN CONTINUE; END IF;
    dx:=(value->>'x')::double precision; dz:=(value->>'z')::double precision;
    input_seq:=(value->>'seq')::bigint;
    IF input_seq<=player.sequence THEN CONTINUE; END IF;
    IF player.jump_at IS NULL OR at_time>=player.jump_at+interval '850 milliseconds' THEN IF coalesce(value->>'stance','stand')<>'prone' OR public.campus_school_walkable(player.x,player.z,player.floor,.9) THEN player.stance:=coalesce(value->>'stance','stand'); END IF; END IF;
    IF coalesce((value->>'jump')::boolean,false) AND NOT player.input_jump AND player.stance='stand' AND (player.jump_at IS NULL OR at_time>=player.jump_at+interval '1 second') THEN player.jump_at:=at_time; END IF;
    player.input_jump:=coalesce((value->>'jump')::boolean,false);player.input_run:=coalesce((value->>'run')::boolean,false);
    player.sequence:=input_seq; player.input_x:=dx; player.input_z:=dz;
    player.input_at:=at_time; player.simulated_at:=at_time;
   ELSIF command_type='sit' AND jsonb_typeof(value)='string' THEN
    seat_id:=value#>>'{}';
    seat_x:=CASE seat_id WHEN 'desk-1' THEN -4.5 WHEN 'desk-2' THEN -1.5 WHEN 'desk-3' THEN 1.5 WHEN 'desk-4' THEN 4.5 WHEN 'lab-1' THEN 21.5 WHEN 'lab-2' THEN 24.5 WHEN 'lab-3' THEN 27.5 WHEN 'lab-4' THEN 30.5 WHEN 'class-1' THEN -3 WHEN 'class-2' THEN 3 WHEN 'seminar-1' THEN -29 WHEN 'seminar-2' THEN -23 WHEN 'project-1' THEN -55 WHEN 'project-2' THEN -49 WHEN 'digital-1' THEN 49 WHEN 'digital-2' THEN 55 WHEN 'astronomy-1' THEN -29 WHEN 'astronomy-2' THEN -23 WHEN 'quiet-1' THEN 23 WHEN 'quiet-2' THEN 29 ELSE NULL END;
    seat_z:=CASE seat_id WHEN 'desk-1' THEN -3 WHEN 'desk-2' THEN -3 WHEN 'desk-3' THEN -3 WHEN 'desk-4' THEN -3 WHEN 'lab-1' THEN -3 WHEN 'lab-2' THEN -3 WHEN 'lab-3' THEN -3 WHEN 'lab-4' THEN -3 WHEN 'class-1' THEN -29 WHEN 'class-2' THEN -29 WHEN 'seminar-1' THEN -29 WHEN 'seminar-2' THEN -29 WHEN 'project-1' THEN -3 WHEN 'project-2' THEN -3 WHEN 'digital-1' THEN -3 WHEN 'digital-2' THEN -3 WHEN 'astronomy-1' THEN -29 WHEN 'astronomy-2' THEN -29 WHEN 'quiet-1' THEN -29 WHEN 'quiet-2' THEN -29 ELSE NULL END;
    IF player.seat IS NULL AND player.travel IS NULL AND abs(player.elevation-player.floor*12)<.05 AND player.floor=(CASE seat_id WHEN 'desk-1' THEN 0 WHEN 'desk-2' THEN 0 WHEN 'desk-3' THEN 0 WHEN 'desk-4' THEN 0 WHEN 'lab-1' THEN 0 WHEN 'lab-2' THEN 0 WHEN 'lab-3' THEN 0 WHEN 'lab-4' THEN 0 WHEN 'class-1' THEN 0 WHEN 'class-2' THEN 0 WHEN 'seminar-1' THEN 1 WHEN 'seminar-2' THEN 1 WHEN 'project-1' THEN 1 WHEN 'project-2' THEN 1 WHEN 'digital-1' THEN 1 WHEN 'digital-2' THEN 1 WHEN 'astronomy-1' THEN 2 WHEN 'astronomy-2' THEN 2 WHEN 'quiet-1' THEN 2 WHEN 'quiet-2' THEN 2 ELSE NULL END) AND seat_x IS NOT NULL
     AND sqrt((player.x-seat_x)^2+(player.z-seat_z)^2)<=2.1
     AND NOT EXISTS(SELECT 1 FROM campus_presence WHERE seat=seat_id) THEN
     player.x:=seat_x; player.z:=seat_z; player.rotation:=pi();
     player.seat:=seat_id; player.status:='seated';player.stance:='stand';player.jump_at:=NULL;player.elevation:=player.floor*12; player.input_x:=0; player.input_z:=0;
     -- Publish within the transaction before another command can reserve it.
     UPDATE campus_presence SET seat=seat_id,status='seated' WHERE campus_id=own;
    ELSE notice:='Move closer to an available seat.';
    END IF;

   ELSIF command_type='environment' AND player.travel IS NULL AND jsonb_typeof(value)='object' THEN
    IF value->>'action'='glass' AND (SELECT count(*) FROM jsonb_object_keys(value))=2 AND value ? 'room' THEN
     SELECT item INTO config FROM jsonb_array_elements('[{"id":"art","x":-26,"z":-26,"floor":0},{"id":"classroom-a","x":0,"z":-26,"floor":0},{"id":"music","x":26,"z":-26,"floor":0},{"id":"auditorium","x":-52,"z":0,"floor":0},{"id":"science","x":-26,"z":0,"floor":0},{"id":"library","x":0,"z":0,"floor":0},{"id":"computer","x":26,"z":0,"floor":0},{"id":"gym","x":-52,"z":26,"floor":0},{"id":"classroom-b","x":-26,"z":26,"floor":0},{"id":"reception","x":0,"z":26,"floor":0},{"id":"cafeteria","x":26,"z":26,"floor":0},{"id":"seminar","x":-26,"z":-26,"floor":1},{"id":"physics","x":0,"z":-26,"floor":1},{"id":"reading","x":26,"z":-26,"floor":1},{"id":"project","x":-52,"z":0,"floor":1},{"id":"digital","x":52,"z":0,"floor":1},{"id":"tea","x":26,"z":26,"floor":1},{"id":"astronomy","x":-26,"z":-26,"floor":2},{"id":"botany","x":0,"z":-26,"floor":2},{"id":"quiet","x":26,"z":-26,"floor":2},{"id":"fitness","x":-52,"z":0,"floor":2},{"id":"commons","x":26,"z":26,"floor":2}]'::jsonb) v(item) WHERE item->>'id'=value->>'room';
     IF config IS NOT NULL AND player.floor=(config->>'floor')::integer AND abs(player.x-(config->>'x')::double precision)<10 AND abs(player.z-(config->>'z')::double precision)<9 THEN
      UPDATE campus_focus_glass SET frosted=CASE WHEN value->>'room'=ANY(frosted) THEN array_remove(frosted,value->>'room') ELSE array_append(frosted,value->>'room') END;
     END IF;
    ELSIF value->>'action'='travel' AND player.status='walking' AND player.seat IS NULL AND (SELECT count(*) FROM jsonb_object_keys(value))=3 AND value ? 'via' AND jsonb_typeof(value->'to')='number' AND value->>'to' IN ('0','1','2') AND abs(player.elevation-player.floor*12)<.05 THEN
     target_floor:=(value->>'to')::integer;
     SELECT item INTO config FROM jsonb_array_elements('[{"id":"lift","name":"Glass elevator","x":-17,"z":39,"exitX":-17,"exitZ":39,"duration":3500,"shaftX":-13},{"id":"escalator","name":"Moving escalator","x":39,"z":13,"exitX":39,"exitZ":-13,"duration":6500},{"id":"slide","name":"Garden slide","x":-39,"z":13,"exitX":-39,"exitZ":39,"duration":4500}]'::jsonb) v(item) WHERE item->>'id'=value->>'via';
     IF config IS NOT NULL AND target_floor<>player.floor THEN
      reverse_trip:=config->>'id'='escalator' AND target_floor=player.floor-1;
      start_x:=(config->>CASE WHEN reverse_trip THEN 'exitX' ELSE 'x' END)::double precision;start_z:=(config->>CASE WHEN reverse_trip THEN 'exitZ' ELSE 'z' END)::double precision;
      end_x:=(config->>CASE WHEN reverse_trip THEN 'x' ELSE 'exitX' END)::double precision;end_z:=(config->>CASE WHEN reverse_trip THEN 'z' ELSE 'exitZ' END)::double precision;
      IF sqrt((player.x-start_x)^2+(player.z-start_z)^2)<=2.2 AND (config->>'id'='lift' OR (config->>'id'='slide' AND player.floor>0 AND target_floor=0) OR (config->>'id'='escalator' AND abs(target_floor-player.floor)=1)) THEN
       player.travel:=jsonb_build_object('via',config->>'id','from',player.floor,'to',target_floor,'x',start_x,'z',start_z,'endX',end_x,'endZ',end_z,'at',extract(epoch FROM at_time)*1000,'duration',(config->>'duration')::integer,'shaftX',coalesce((config->>'shaftX')::double precision,start_x));
       player.x:=start_x;player.z:=start_z;player.stance:=CASE WHEN config->>'id'='slide' THEN 'crouch' ELSE 'stand' END;player.jump_at:=NULL;player.input_x:=0;player.input_z:=0;player.simulated_at:=at_time;
      END IF;
     END IF;
    END IF;
   ELSIF command_type='action' AND player.seat IS NOT NULL AND jsonb_typeof(value)='string' THEN
    IF value#>>'{}'='stand' THEN
     player.z:=player.z+1; player.seat:=NULL; player.status:='walking';
     player.input_x:=0; player.input_z:=0; player.simulated_at:=at_time;
     UPDATE campus_presence SET seat=NULL,status='walking' WHERE campus_id=own;
    ELSIF value#>>'{}'='study' THEN player.status:='studying';
    ELSIF value#>>'{}'='close' THEN player.status:='seated';
    END IF;
   END IF;
  END LOOP;
 ELSE
  player.rate_count:=30;
 END IF;
 UPDATE campus_presence SET x=player.x,z=player.z,rotation=player.rotation,
  seat=player.seat,status=player.status,floor=player.floor,elevation=player.elevation,stance=player.stance,travel=player.travel,jump_at=player.jump_at,input_run=player.input_run,input_jump=player.input_jump,input_x=player.input_x,input_z=player.input_z,
  input_at=player.input_at,simulated_at=player.simulated_at,sequence=player.sequence,
  lease_until=at_time+interval '15 seconds',rate_at=player.rate_at,rate_count=player.rate_count
 WHERE campus_id=own;
 SELECT user_id INTO member_user FROM campus_members WHERE campus_id=own;
 SELECT jsonb_build_object('self',own,
  'players',coalesce((SELECT jsonb_agg(jsonb_build_object(
   'id',p.campus_id,'pseudonym',m.pseudonym,'colour',m.colour,
   'x',p.x,'z',p.z,'floor',p.floor,'elevation',p.elevation,'stance',p.stance,'travel',p.travel->>'via','rotation',p.rotation,'seat',p.seat,'status',p.status) ORDER BY p.campus_id)
   FROM campus_presence p JOIN campus_members m USING(campus_id)
   WHERE NOT EXISTS(SELECT 1 FROM campus_blocks b WHERE b.owner_id=member_user AND b.target=p.campus_id)), '[]'::jsonb),
  'frosted',(SELECT to_jsonb(frosted) FROM campus_focus_glass),'occupied',coalesce((SELECT jsonb_agg(seat ORDER BY seat) FROM campus_presence WHERE seat IS NOT NULL),'[]'::jsonb)
 ) INTO snapshot;
 RETURN jsonb_build_object('snapshot',snapshot,'notice',notice,'world_revision','school-v1');
END;
$$;
CREATE OR REPLACE FUNCTION public.campus_runtime(
 runtime_connection uuid,runtime_operation text,runtime_commands jsonb DEFAULT '[]'::jsonb,
 ticket_hash text DEFAULT NULL,expected_campus uuid DEFAULT NULL,runtime_renew boolean DEFAULT false
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE result jsonb; occupants integer;
BEGIN
 result:=public.campus_runtime_school(runtime_connection,runtime_operation,runtime_commands,ticket_hash,expected_campus,runtime_renew);
 -- The underlying runtime retains the global room lock for this transaction.
 SELECT count(*) INTO occupants FROM campus_presence;
 IF occupants=0 OR (runtime_operation='connect' AND runtime_renew IS NOT TRUE AND result ? 'snapshot' AND occupants=1) THEN
  UPDATE campus_focus_glass SET frosted='{}';
  UPDATE campus_basketball SET state=public.campus_basketball_initial(),version=version+1
   WHERE room='library' AND state IS DISTINCT FROM public.campus_basketball_initial();
 END IF;
 IF NOT(result ? 'snapshot') THEN RETURN result; END IF;
 RETURN result||jsonb_build_object('world_revision','school-v3-living-cube','game',public.campus_basketball_envelope());
END;
$$;
CREATE OR REPLACE FUNCTION public.campus_basketball_envelope() RETURNS jsonb LANGUAGE sql VOLATILE SECURITY DEFINER SET search_path=public,pg_temp AS $$
 SELECT jsonb_build_object('version',version,'state',state,'now',extract(epoch FROM clock_timestamp())*1000,'players',coalesce((SELECT jsonb_agg(jsonb_build_object('id',campus_id,'x',x,'z',z,'floor',floor,'travel',travel->>'via','rotation',rotation,'status',status) ORDER BY campus_id) FROM campus_presence WHERE lease_until>clock_timestamp() AND public.campus_allowed(campus_id)),'[]'::jsonb)) FROM campus_basketball WHERE room='library';$$;
CREATE OR REPLACE FUNCTION public.campus_basketball_commit(game_connection uuid,game_version bigint,game_state jsonb)
 RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE own uuid; current_version bigint; current_state jsonb; candidate uuid; old_holder uuid; at_time timestamptz; flight_time double precision; catch_travel double precision;
BEGIN
 PERFORM 1 FROM campus_runtime_lock WHERE room='library' FOR UPDATE;
 at_time:=clock_timestamp();
 SELECT campus_id INTO own FROM campus_presence WHERE connection_id=game_connection AND lease_until>at_time AND public.campus_allowed(campus_id);
 IF own IS NULL THEN RETURN jsonb_build_object('ended',true); END IF;
 SELECT version,state INTO current_version,current_state FROM campus_basketball WHERE room='library' FOR UPDATE;
 IF current_version IS DISTINCT FROM game_version THEN RETURN jsonb_build_object('applied',false,'game',public.campus_basketball_envelope()); END IF;
 IF jsonb_typeof(game_state) IS DISTINCT FROM 'object' OR jsonb_typeof(game_state->'x') IS DISTINCT FROM 'number'
  OR jsonb_typeof(game_state->'y') IS DISTINCT FROM 'number' OR jsonb_typeof(game_state->'z') IS DISTINCT FROM 'number'
  OR (game_state->>'x')::numeric NOT BETWEEN 41 AND 63 OR (game_state->>'z')::numeric NOT BETWEEN -10 AND 10
  OR (game_state->>'y')::numeric NOT BETWEEN .36 AND 13
  OR (game_state->>'at')::numeric>(extract(epoch FROM at_time)*1000) OR (game_state->>'at')::numeric<(current_state->>'at')::numeric THEN
  RAISE EXCEPTION 'Invalid court proposal';
 END IF;
 candidate:=nullif(game_state->>'holder','')::uuid;old_holder:=nullif(current_state->>'holder','')::uuid;
 IF old_holder IS NOT NULL AND candidate IS DISTINCT FROM old_holder AND old_holder<>own AND EXISTS(
  SELECT 1 FROM campus_presence WHERE campus_id=old_holder AND lease_until>at_time AND floor=0 AND campus_presence.travel IS NULL AND status='walking'
   AND x>42 AND x<62 AND z>-9 AND z<9 AND public.campus_allowed(campus_id)) THEN RAISE EXCEPTION 'Court ownership denied'; END IF;
 IF candidate IS NOT NULL AND NOT EXISTS(SELECT 1 FROM campus_presence WHERE campus_id=candidate AND lease_until>at_time
  AND floor=0 AND campus_presence.travel IS NULL AND status='walking' AND x>42 AND x<62 AND z>-9 AND z<9 AND public.campus_allowed(campus_id)) THEN
  RETURN jsonb_build_object('applied',false,'game',public.campus_basketball_envelope());
 END IF;
 IF candidate IS DISTINCT FROM old_holder AND candidate IS NOT NULL AND candidate<>own THEN RAISE EXCEPTION 'Court ownership denied'; END IF;
 -- The trusted service first advances physics from this version to database time.
 -- Its exact reach test uses that advanced position, while this conservative
 -- bound prevents a second, stale-position check from rejecting a falling catch.
 flight_time:=greatest(0,least(.5,((game_state->>'at')::double precision-(current_state->>'at')::double precision)/1000));
 catch_travel:=sqrt((current_state->>'vx')::double precision^2+(current_state->>'vy')::double precision^2+(current_state->>'vz')::double precision^2)*flight_time+9.81*flight_time^2/2;
 IF candidate IS DISTINCT FROM old_holder AND candidate IS NOT NULL AND NOT EXISTS(SELECT 1 FROM campus_presence WHERE campus_id=own AND floor=0 AND campus_presence.travel IS NULL
  AND sqrt((x-(current_state->>'x')::double precision)^2+(z-(current_state->>'z')::double precision)^2)<=2.1+catch_travel
  AND (current_state->>'y')::double precision<=2.3+catch_travel) THEN RAISE EXCEPTION 'Court pickup denied'; END IF;
 UPDATE campus_basketball SET state=game_state,version=version+1 WHERE room='library';
 RETURN jsonb_build_object('applied',true,'game',public.campus_basketball_envelope());
END;
$$;
COMMIT;
