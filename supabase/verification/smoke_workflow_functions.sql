begin;

do $$
declare
  admin_user_id text := '10000000-0000-0000-0000-000000000001';
  coach_user_id text := '10000000-0000-0000-0000-000000000002';
  coach_id text := '10000000-0000-0000-0000-000000000003';
  plan_id text := '10000000-0000-0000-0000-000000000004';
  session_id text := '10000000-0000-0000-0000-000000000005';
  lead_id text := '10000000-0000-0000-0000-000000000006';
  client_id text;
  subscription_id text;
begin
  insert into public."User" (id,name,email,"clientId",password,role)
  values
    (admin_user_id,'Smoke Admin','smoke-admin@example.invalid','SMOKE-ADMIN','$2b$12$smokehashsmokehashsmokehashsmokehashsmokehash','ADMIN'),
    (coach_user_id,'Smoke Coach','smoke-coach@example.invalid','SMOKE-COACH','$2b$12$smokehashsmokehashsmokehashsmokehashsmokehash','COACH');
  insert into public."Coach" (id,"fullName","userId")
  values (coach_id,'Smoke Coach',coach_user_id);

  client_id := public.admin_save_client(jsonb_build_object(
    'fullName','Smoke Client','email','smoke-client@example.invalid',
    'status','ACTIVE','paymentStatus','UNPAID','loginClientId','SMOKE-CLIENT',
    'password','$2b$12$smokehashsmokehashsmokehashsmokehashsmokehash'
  ))::text;
  if not exists (select 1 from public."Client" where id=client_id) then
    raise exception 'admin_save_client failed';
  end if;

  insert into public."SubscriptionPlan" (id,name,slug,"billingCycle",price)
  values (plan_id,'Smoke Plan','smoke-plan','MONTHLY',100);
  subscription_id := public.admin_save_subscription(jsonb_build_object(
    'clientId',client_id,'planId',plan_id,'status','ACTIVE',
    'paymentStatus','UNPAID','amount',100,
    'renewsAt',(now()+interval '30 days')::text
  ))->>'id';
  perform public.admin_mutate_subscription(subscription_id::uuid,'pause');
  perform public.admin_mutate_subscription(subscription_id::uuid,'resume');
  perform public.admin_mutate_subscription(subscription_id::uuid,'renew');

  insert into public."TrainingSession" (id,title,type,status,"coachId","createdById","startsAt","endsAt")
  values (session_id,'Smoke Session','GROUP','SCHEDULED',coach_id,admin_user_id,now()+interval '1 day',now()+interval '1 day 1 hour');
  insert into public."SessionBooking" ("trainingSessionId","clientId",status)
  values (session_id,client_id,'BOOKED');
  perform public.update_session_attendance(session_id,client_id,'ATTENDED');
  perform public.update_training_session(session_id,'Updated Smoke Session','','GROUP','SCHEDULED',coach_id,'',now()+interval '1 day',now()+interval '1 day 1 hour',10);
  perform public.cancel_training_session(session_id);

  insert into public."Lead" (id,"fullName",email,phone,status)
  values (lead_id,'Smoke Lead','smoke-lead@example.invalid','000','NEW');
  perform public.promote_lead_to_client(
    lead_id::uuid,'SMOKE-LEAD','$2b$12$smokehashsmokehashsmokehashsmokehashsmokehash'
  );
  if not exists (select 1 from public."Lead" where id=lead_id and status='CONVERTED') then
    raise exception 'promote_lead_to_client failed';
  end if;

  perform public.admin_delete_client(client_id::uuid);
  if exists (select 1 from public."Client" where id=client_id) then
    raise exception 'admin_delete_client failed';
  end if;
end;
$$;

rollback;
