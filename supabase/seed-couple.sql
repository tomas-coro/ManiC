with c as (
  insert into couples default values returning id
)
insert into members (user_id, couple_id, slot, display_name)
select u.id, c.id, u.slot, u.name
from c,
(values
  ('f54aa32b-cdfd-47bc-9577-021abab52ef9'::uuid, 1::smallint, 'Tomas'),
  ('ce8cb9e7-7652-449a-8e09-28b5f5b89761'::uuid, 2::smallint, 'Giulia')
) as u(id, slot, name);
