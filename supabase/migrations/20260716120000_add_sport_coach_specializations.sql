-- Phase (coach experience): let coaches be tagged by the sports and goals Marvel
-- actually coaches, not only generic gym modalities. Additive — existing values
-- (STRENGTH/CONDITIONING/MOBILITY/PRIVATE_COACHING) stay valid.

alter type "CoachSpecialization" add value if not exists 'FOOTBALL';
alter type "CoachSpecialization" add value if not exists 'TENNIS';
alter type "CoachSpecialization" add value if not exists 'CALISTHENICS';
alter type "CoachSpecialization" add value if not exists 'REHAB';
alter type "CoachSpecialization" add value if not exists 'ATHLETIC_PERFORMANCE';
alter type "CoachSpecialization" add value if not exists 'GENERAL_FITNESS';
